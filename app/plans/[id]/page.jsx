"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  getLocationData,
  extractLocationsFromPlan,
  getMultipleLocationsData,
  enrichPlanWithLocationData,
} from "../../../utils/locationUtils";
import InteractiveMap from "../../../components/InteractiveMap";
import { useAuth } from "../../../contexts/AuthContext";
import { usePlanData } from "../../../contexts/PlanDataContext";
import UserProfile from "../../../components/Auth/UserProfile";
import BlurredContent from "../../../components/BlurredContent";
import ProgressModalDynamic from "../../../components/ProgressModalDynamic";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PlansPage({ params }) {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { planData, isDirectTransition, clearPlanData } = usePlanData();

  // Next.js 15対応: paramsを正しく解決
  const resolvedParams = use(params);
  const planId = resolvedParams?.id;
  console.log("🎨 URLパラメータ planId:", planId);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState({});
  const [locationData, setLocationData] = useState({});
  const [activityImages, setActivityImages] = useState({});
  const [heroImages, setHeroImages] = useState({});
  const [dayImages, setDayImages] = useState({});
  const [routeData, setRouteData] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [hasStoredPlans, setHasStoredPlans] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [people, setPeople] = useState(2);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // 進捗モーダル用の状態
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationProgress, setRegenerationProgress] = useState(0);

  // 追加データ（画像・マップ等）の読み込み状態
  const [additionalDataLoading, setAdditionalDataLoading] = useState(false);
  const [additionalDataProgress, setAdditionalDataProgress] = useState(0);

  // クライアントサイドレンダリングの確認
  useEffect(() => {
    setIsClient(true);
  }, []);

  // プランデータを取得（直接遷移またはFirestoreから）
  useEffect(() => {
    console.log("🎨 プラン詳細ページ useEffect開始");
    console.log("🎨 isClient:", isClient, "authLoading:", authLoading);
    console.log("🎨 currentUser:", currentUser);
    console.log("🎨 isDirectTransition:", isDirectTransition);
    console.log("🎨 planData:", planData);
    console.log("🎨 planId:", planId);
    console.log("🎨 loading:", loading);

    if (!isClient || authLoading) {
      console.log("🎨 クライアント未準備または認証読み込み中のため処理を中止");
      return; // 認証の読み込み中は処理しない
    }

    if (!planId) {
      console.log("🎨 planIDが取得できません");
      return; // planIdがない場合は処理しない
    }

    // ログインユーザーかどうかで処理を分岐（ログイン不要でアクセス可能）
    const isLoggedIn = !!currentUser;
    console.log("🎨 ログイン状態:", isLoggedIn ? "ログイン済み" : "未ログイン");

    const fetchPlans = async () => {
      try {
        // 直接遷移の場合はContextからデータを使用（ログインユーザーのみ）
        if (isLoggedIn && isDirectTransition && planData) {
          console.log("🎨 直接遷移: Contextからプランデータを使用", planData);
          console.log("🎨 直接遷移: プラン数", planData.plans?.length);
          setPlans(planData.plans);
          if (planData.travelDates) {
            setStartDate(planData.travelDates.startDate || "");
            setEndDate(planData.travelDates.endDate || "");
          }
          console.log("🎨 直接遷移: ローディング終了設定");
          setLoading(false);
          // 直接遷移の場合はContextをクリアしない（追加データ取得後にクリア）
          return;
        }

        // URLアクセスの場合はFirestoreから取得（ログイン・非ログイン問わず）
        console.log("URLアクセス: Firestoreからプランを取得中...", planId);
        console.log(
          "🎨 アクセス種別:",
          isLoggedIn ? "ログインユーザー" : "非ログインユーザー"
        );

        if (!planId) {
          console.error("🎨 プランIDが取得できません");
          router.push("/");
          return;
        }

        // まずAPIエンドポイント経由で取得を試行
        let firestorePlanData = null;
        try {
          const getResponse = await fetch(`/api/get-travel-plan?uid=${planId}`);
          const getResult = await getResponse.json();
          console.log("🎨 API取得結果:", getResult);

          if (getResponse.ok && !getResult.fallback) {
            firestorePlanData = getResult.data;
            console.log("🎨 API経由で取得成功!");
          } else {
            throw new Error("API取得失敗、直接取得にフォールバック");
          }
        } catch (apiError) {
          console.log(
            "🎨 API取得失敗、直接Firestore取得を試行:",
            apiError.message
          );
          const planDocRef = doc(db, "travel_plans", planId);
          const planDocSnap = await getDoc(planDocRef);

          if (planDocSnap.exists()) {
            firestorePlanData = planDocSnap.data();
            console.log("🎨 直接Firestore取得成功:", firestorePlanData);
          }
        }

        if (firestorePlanData) {
          console.log("🎨 取得したプランデータ:", firestorePlanData);

          // 新しい形式（日付情報を含む）の場合
          if (
            firestorePlanData.plans &&
            Array.isArray(firestorePlanData.plans)
          ) {
            console.log(
              "🎨 新形式のプランデータ、プラン数:",
              firestorePlanData.plans.length
            );
            setPlans(firestorePlanData.plans);
            // 日付情報が含まれている場合は状態にセット
            if (
              firestorePlanData.travelDates ||
              firestorePlanData.travel_dates
            ) {
              const travelDates =
                firestorePlanData.travelDates || firestorePlanData.travel_dates;
              setStartDate(travelDates.startDate || "");
              setEndDate(travelDates.endDate || "");
            }
          } else if (Array.isArray(firestorePlanData)) {
            // 古い形式（プランのみの配列）の場合
            console.log(
              "🎨 古形式のプランデータ（配列）、プラン数:",
              firestorePlanData.length
            );
            setPlans(firestorePlanData);
          } else {
            // 単一プランの場合は配列に変換
            console.log("🎨 単一プランデータを配列に変換");
            setPlans([firestorePlanData]);
          }
          console.log("🎨 URLアクセス: ローディング終了設定");
          setLoading(false);
        } else {
          // Firestoreにデータがない場合はホームページにリダイレクト
          console.log(
            "🎨 プランデータが見つかりません。ホームページにリダイレクトします。"
          );
          router.push("/");
          return;
        }
      } catch (error) {
        console.error("🎨 プランの取得に失敗:", error);
        // エラー時はホームページにリダイレクト
        console.log("🎨 エラー: ローディング終了設定");
        setLoading(false);
        router.push("/");
      }
    };

    fetchPlans();
  }, [
    isClient,
    currentUser,
    authLoading,
    router,
    isDirectTransition,
    planData,
    planId,
  ]); // 依存配列を適切に設定

  // 位置情報とホテル情報を取得
  useEffect(() => {
    if (plans.length === 0 || !isClient) return;

    const fetchData = async () => {
      // 直接遷移の場合は段階的にデータ取得
      if (isDirectTransition) {
        console.log("直接遷移: 段階的データ取得を開始");
        // Contextからのデータを使用後、追加データの取得を1秒後に開始
        setTimeout(() => {
          fetchAdditionalData();
        }, 1000);
        return;
      }

      // URLアクセスの場合は通常の処理
      fetchAdditionalData();
    };

    const fetchAdditionalData = async () => {
      try {
        // plansが有効であることを確認
        if (!plans || !Array.isArray(plans) || plans.length === 0) {
          console.warn("プランデータが無効です:", plans);
          setLoading(false);
          return;
        }

        console.log("🎨 追加データ取得開始（画像・マップ・ホテル）");
        setAdditionalDataLoading(true);
        setAdditionalDataProgress(0);

        const mockPlans = plans;

        // 全プランから位置情報を抽出
        const allLocations = new Set();
        mockPlans.forEach((plan) => {
          const locations = extractLocationsFromPlan(plan);
          locations.forEach((loc) => allLocations.add(loc));
        });

        // 位置情報を一括取得
        const locationsArray = Array.from(allLocations);
        console.log("取得する位置情報:", locationsArray);
        setAdditionalDataProgress(10);

        let locationResults = {};
        try {
          locationResults = await getMultipleLocationsData(locationsArray);
          console.log("位置情報取得結果:", locationResults);
          setLocationData(locationResults);
          setAdditionalDataProgress(25);
        } catch (error) {
          console.error("位置情報取得に失敗:", error);
          // エラーが発生してもアプリケーションを継続
          setLocationData({});
          setAdditionalDataProgress(25);
        }

        // 各プランの日毎にホテルを検索（改善版）
        const hotelPromises = [];
        const hotelResults = {};

        for (const plan of plans.filter(
          (plan) => plan && plan.itinerary && Array.isArray(plan.itinerary)
        )) {
          hotelResults[plan.trip_id] = {};

          for (const day of plan.itinerary) {
            // 最終日以外の日でホテル検索
            if (
              day.accommodation &&
              day.accommodation !== "出発日のため宿泊なし"
            ) {
              const accommodationLocation = day.accommodation;
              const dayNumber = day.day;

              // チェックイン日とチェックアウト日を設定
              const today = new Date();
              const checkinDate = new Date(
                today.getTime() + (7 + dayNumber - 1) * 24 * 60 * 60 * 1000
              );
              const checkoutDate = new Date(
                checkinDate.getTime() + 24 * 60 * 60 * 1000
              );

              const checkinStr = checkinDate.toISOString().split("T")[0];
              const checkoutStr = checkoutDate.toISOString().split("T")[0];

              const promise = (async () => {
                try {
                  console.log(
                    `Day ${dayNumber} ホテル検索: ${accommodationLocation}`,
                    {
                      checkin: checkinStr,
                      checkout: checkoutStr,
                    }
                  );

                  const hotelResponse = await fetch("/api/search-hotels", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      checkin: checkinStr,
                      checkout: checkoutStr,
                      adults: 2,
                      searchType: "location",
                      location: accommodationLocation,
                    }),
                  });

                  if (hotelResponse.ok) {
                    const hotelData = await hotelResponse.json();
                    console.log(`Day ${dayNumber} ホテル検索成功:`, hotelData);
                    return {
                      trip_id: plan.trip_id,
                      day: dayNumber,
                      results: hotelData.results || [],
                    };
                  } else {
                    console.error(
                      `Day ${dayNumber} ホテル検索失敗:`,
                      hotelResponse.status
                    );
                  }
                } catch (error) {
                  console.error(`Day ${dayNumber} ホテル検索エラー:`, error);
                }
                return { trip_id: plan.trip_id, day: dayNumber, results: [] };
              })();

              hotelPromises.push(promise);
            }
          }
        }

        // ホテル情報を設定（日毎）
        try {
          const hotelResponses = await Promise.all(hotelPromises);
          hotelResponses.forEach((response) => {
            if (!hotelResults[response.trip_id]) {
              hotelResults[response.trip_id] = {};
            }
            hotelResults[response.trip_id][`day_${response.day}`] =
              response.results;
          });
          console.log("日毎ホテル検索結果:", hotelResults);
          setHotels(hotelResults);
          setAdditionalDataProgress(50);
        } catch (error) {
          console.error("ホテル情報取得に失敗:", error);
          // エラーが発生してもアプリケーションを継続
          setHotels({});
          setAdditionalDataProgress(50);
        }

        // プランのヒーロー画像を並行取得
        const heroImagePromises = [];
        const heroImageResults = {};

        for (const plan of plans.filter((p) => p && p.hero && p.hero.title)) {
          console.log(
            `ヒーロー画像取得開始: ${plan.hero.title} (Trip: ${plan.trip_id})`
          );

          const promise = fetch("/api/places-photos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              placeName: plan.hero.title,
            }),
          })
            .then(async (response) => {
              console.log(
                `ヒーロー画像レスポンス (${plan.hero.title}):`,
                response.status
              );
              if (response.ok) {
                const imageData = await response.json();
                console.log(
                  `ヒーロー画像取得成功 (${plan.hero.title}):`,
                  imageData
                );
                return {
                  trip_id: plan.trip_id,
                  data: imageData,
                };
              } else {
                const errorData = await response
                  .json()
                  .catch(() => ({ error: "不明なエラー" }));
                console.warn(
                  `ヒーロー画像取得失敗 (${plan.hero.title}):`,
                  response.status,
                  errorData
                );
              }
              return null;
            })
            .catch((error) => {
              console.error(
                `ヒーロー画像取得エラー (${plan.hero.title}):`,
                error
              );
              return null;
            });

          heroImagePromises.push(promise);
        }

        // 各日のヘッダー画像を並行取得
        const dayImagePromises = [];
        const dayImageResults = {};

        for (const plan of plans.filter(
          (p) => p && p.itinerary && Array.isArray(p.itinerary)
        )) {
          dayImageResults[plan.trip_id] = {};

          for (const day of plan.itinerary.filter(
            (d) => d && d.city && d.city.name
          )) {
            console.log(
              `日程画像取得開始: ${day.city.name} (Trip: ${plan.trip_id}, Day: ${day.day})`
            );

            const promise = fetch("/api/places-photos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                placeName: day.city.name,
              }),
            })
              .then(async (response) => {
                console.log(
                  `日程画像レスポンス (${day.city.name}):`,
                  response.status
                );
                if (response.ok) {
                  const imageData = await response.json();
                  console.log(
                    `日程画像取得成功 (${day.city.name}):`,
                    imageData
                  );
                  return {
                    trip_id: plan.trip_id,
                    day: day.day,
                    data: imageData,
                  };
                } else {
                  const errorData = await response
                    .json()
                    .catch(() => ({ error: "不明なエラー" }));
                  console.warn(
                    `日程画像取得失敗 (${day.city.name}):`,
                    response.status,
                    errorData
                  );
                }
                return null;
              })
              .catch((error) => {
                console.error(`日程画像取得エラー (${day.city.name}):`, error);
                return null;
              });

            dayImagePromises.push(promise);
          }
        }

        // アクティビティの画像を並行取得（パフォーマンス改善）
        const activityImagePromises = [];
        const activityImageResults = {};

        for (const plan of plans.filter(
          (p) => p && p.itinerary && Array.isArray(p.itinerary)
        )) {
          activityImageResults[plan.trip_id] = {};

          for (const day of plan.itinerary.filter(
            (d) => d && d.activities && Array.isArray(d.activities)
          )) {
            for (const activity of day.activities.filter(
              (a) => a && a.title && a.id
            )) {
              console.log(
                `画像取得開始: ${activity.title} (Trip: ${plan.trip_id}, Activity: ${activity.id})`
              );

              const promise = fetch("/api/places-photos", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  placeName: activity.title,
                }),
              })
                .then(async (response) => {
                  console.log(
                    `画像取得レスポンス (${activity.title}):`,
                    response.status,
                    response.statusText
                  );
                  if (response.ok) {
                    const imageData = await response.json();
                    console.log(`画像取得成功 (${activity.title}):`, imageData);
                    return {
                      trip_id: plan.trip_id,
                      activity_id: activity.id,
                      data: imageData,
                    };
                  } else {
                    const errorData = await response
                      .json()
                      .catch(() => ({ error: "不明なエラー" }));
                    console.warn(
                      `画像取得失敗 (${activity.title}):`,
                      response.status,
                      errorData
                    );
                  }
                  return null;
                })
                .catch((error) => {
                  console.error(
                    `アクティビティ画像取得エラー (${activity.title}):`,
                    error
                  );
                  return null;
                });

              activityImagePromises.push(promise);
            }
          }
        }

        // ヒーロー画像を設定
        try {
          const heroImageResponses = await Promise.all(heroImagePromises);
          heroImageResponses.forEach((response) => {
            if (response) {
              heroImageResults[response.trip_id] = response.data;
            }
          });
          console.log("ヒーロー画像取得結果:", heroImageResults);
          setHeroImages(heroImageResults);
          setAdditionalDataProgress(70);
        } catch (error) {
          console.error("ヒーロー画像取得に失敗:", error);
          setHeroImages({});
          setAdditionalDataProgress(70);
        }

        // 日程画像を設定
        try {
          const dayImageResponses = await Promise.all(dayImagePromises);
          dayImageResponses.forEach((response) => {
            if (response) {
              if (!dayImageResults[response.trip_id]) {
                dayImageResults[response.trip_id] = {};
              }
              // 修正: day番号で直接保存
              dayImageResults[response.trip_id][response.day] = response.data;
            }
          });
          console.log("日程画像取得結果:", dayImageResults);
          setDayImages(dayImageResults);
          setAdditionalDataProgress(80);
        } catch (error) {
          console.error("日程画像取得に失敗:", error);
          setDayImages({});
          setAdditionalDataProgress(80);
        }

        // アクティビティ画像を設定
        try {
          const activityImageResponses = await Promise.all(
            activityImagePromises
          );
          activityImageResponses.forEach((response) => {
            if (response) {
              activityImageResults[response.trip_id][response.activity_id] =
                response.data;
            }
          });
          console.log("アクティビティ画像取得結果:", activityImageResults);
          setActivityImages(activityImageResults);
          setAdditionalDataProgress(90);
        } catch (error) {
          console.error("アクティビティ画像取得に失敗:", error);
          // エラーが発生してもアプリケーションを継続
          setActivityImages({});
          setAdditionalDataProgress(90);
        }

        // 各プランの経路情報を並行取得（パフォーマンス改善）
        const routePromises = [];
        const routeResults = {};

        for (const plan of plans) {
          routeResults[plan.trip_id] = {};

          // 全体プランルート
          const allWaypoints = [];
          for (const day of plan.itinerary || []) {
            if (day.city && day.city.name) {
              allWaypoints.push(day.city.name);
            }
          }

          if (allWaypoints.length >= 2) {
            const overallPromise = fetch("/api/directions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ waypoints: allWaypoints }),
            })
              .then(async (response) => {
                if (response.ok) {
                  const routeData = await response.json();
                  return {
                    trip_id: plan.trip_id,
                    type: "overall",
                    data: routeData,
                  };
                }
                return null;
              })
              .catch((error) => {
                console.error(`全体経路取得エラー (${plan.trip_id}):`, error);
                return null;
              });

            routePromises.push(overallPromise);
          }

          // 各日のアクティビティ間の経路を取得
          for (const day of plan.itinerary || []) {
            const dailyWaypoints = [];

            for (const activity of day.activities || []) {
              if (activity.location) {
                dailyWaypoints.push(activity.location);
              }
            }

            if (dailyWaypoints.length >= 2) {
              console.log(
                `Day ${day.day} ルート取得中 (${plan.trip_id}):`,
                dailyWaypoints
              );
              const dailyPromise = fetch("/api/directions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ waypoints: dailyWaypoints }),
              })
                .then(async (response) => {
                  if (response.ok) {
                    const routeData = await response.json();
                    return {
                      trip_id: plan.trip_id,
                      type: `day_${day.day}`,
                      data: routeData,
                    };
                  }
                  console.error(
                    `Day ${day.day} ルート取得失敗 (${plan.trip_id}):`,
                    response.status
                  );
                  return null;
                })
                .catch((error) => {
                  console.error(
                    `Day ${day.day} 経路取得エラー (${plan.trip_id}):`,
                    error
                  );
                  return null;
                });

              routePromises.push(dailyPromise);
            }
          }
        }

        // 経路情報を設定
        try {
          const routeResponses = await Promise.all(routePromises);
          routeResponses.forEach((response) => {
            if (response) {
              routeResults[response.trip_id][response.type] = response.data;
            }
          });
          console.log("ルート取得結果:", routeResults);
          setRouteData(routeResults);
          setAdditionalDataProgress(100);
        } catch (error) {
          console.error("ルート情報取得に失敗:", error);
          // エラーが発生してもアプリケーションを継続
          setRouteData({});
          setAdditionalDataProgress(100);
        }

        // 追加データ取得完了
        console.log("🎨 追加データ取得完了");
        setAdditionalDataLoading(false);
        setLoading(false);

        // 直接遷移の場合は追加データ取得完了後にContextをクリア
        if (isDirectTransition) {
          console.log("🎯 追加データ取得完了、Contextをクリア");
          clearPlanData();
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
        setAdditionalDataLoading(false);
        setLoading(false);

        // エラー時もContextをクリア
        if (isDirectTransition) {
          clearPlanData();
        }
      }
    };

    fetchData();
  }, [plans, isDirectTransition]);

  const fetchHotels = async (tripId, planData) => {
    try {
      if (!planData?.itinerary) return;

      const hotelPromises = planData.itinerary.map(async (day) => {
        if (
          !day.accommodation ||
          day.accommodation === "出発日のため宿泊なし"
        ) {
          return null;
        }

        try {
          // 楽天トラベルAPIを使用してホテル検索
          const response = await fetch("/api/hotels", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              location: day.accommodation,
              checkin: day.day === 1 ? startDate : null,
              checkout: day.day === planData.itinerary.length ? endDate : null,
              adults: people || 2,
              roomCount: 1,
            }),
          });

          if (!response.ok) {
            throw new Error(`ホテル検索エラー: ${response.status}`);
          }

          const hotelData = await response.json();
          return {
            dayKey: `day_${day.day}`,
            hotels: hotelData.hotels || [],
          };
        } catch (error) {
          console.error(`Day ${day.day}のホテル検索エラー:`, error);
          return {
            dayKey: `day_${day.day}`,
            hotels: [],
          };
        }
      });

      const hotelResults = await Promise.all(hotelPromises);
      const hotelsByDay = {};

      hotelResults.forEach((result) => {
        if (result) {
          hotelsByDay[result.dayKey] = result.hotels;
        }
      });

      setHotels((prev) => ({
        ...prev,
        [tripId]: hotelsByDay,
      }));
    } catch (error) {
      console.error("ホテル検索の全体エラー:", error);
    }
  };

  // fetchRoutes関数の修正
  const fetchDetailedRoutes = async (tripId, planData) => {
    try {
      if (!planData?.itinerary) return;

      console.log(`=== 詳細経路探索開始: ${tripId} ===`);

      const allRouteSegments = {};
      const routePromises = [];
      const totalDistanceTracker = { total: 0 };

      // 各日の詳細経路を取得
      for (const day of planData.itinerary) {
        // day.activitiesが存在しない場合はスキップ
        if (!day.activities || !Array.isArray(day.activities)) {
          console.warn(
            `Day ${day.day}: activitiesが存在しないか、配列ではありません`,
            day
          );
          continue;
        }

        const dayKey = `day_${day.day}`;
        console.log(`\n--- Day ${day.day} 開始 ---`);

        allRouteSegments[dayKey] = {
          segments: [],
          dayTotalDistance: 0,
          dayTotalDuration: 0,
          crossDaySegment: null,
        };

        // その日のアクティビティ（search_queryがあるもののみ）
        const dayActivities = day.activities.filter(
          (activity) =>
            activity &&
            activity.search_query &&
            activity.search_query.trim() !== ""
        );

        console.log(
          `Day ${day.day} 全アクティビティ:`,
          day.activities.map((a) => ({
            title: a?.title || "不明",
            search_query: a?.search_query || "なし",
          }))
        );
        console.log(
          `Day ${day.day} 有効なアクティビティ:`,
          dayActivities.map((a) => a.title)
        );

        // 前日の最後のアクティビティから今日の最初のアクティビティへの移動（日跨ぎ）
        if (day.day > 1 && dayActivities.length > 0) {
          const previousDay = planData.itinerary.find(
            (d) => d.day === day.day - 1
          );
          if (
            previousDay &&
            previousDay.activities &&
            Array.isArray(previousDay.activities)
          ) {
            const previousDayActivities = previousDay.activities.filter(
              (activity) =>
                activity &&
                activity.search_query &&
                activity.search_query.trim() !== ""
            );

            if (previousDayActivities.length > 0) {
              const lastActivityPrevDay =
                previousDayActivities[previousDayActivities.length - 1];
              const firstActivityToday = dayActivities[0];

              console.log(
                `🌅 日跨ぎ移動設定: ${lastActivityPrevDay.title} → ${firstActivityToday.title}`
              );

              // 日跨ぎの経路を取得
              const crossDayPromise = fetchSingleRouteSegment(
                {
                  type: "activity",
                  name:
                    lastActivityPrevDay.location || lastActivityPrevDay.title,
                  searchQuery: lastActivityPrevDay.search_query,
                  id: lastActivityPrevDay.id,
                  title: lastActivityPrevDay.title,
                },
                {
                  type: "activity",
                  name: firstActivityToday.location || firstActivityToday.title,
                  searchQuery: firstActivityToday.search_query,
                  id: firstActivityToday.id,
                  title: firstActivityToday.title,
                },
                day.day,
                "cross_day",
                tripId,
                totalDistanceTracker
              );

              routePromises.push(crossDayPromise);
            } else {
              console.log(
                `⚠️ Day ${
                  day.day - 1
                } に有効なアクティビティがないため、日跨ぎ移動をスキップ`
              );
            }
          }
        }

        // その日のアクティビティ間の移動
        for (let i = 0; i < dayActivities.length - 1; i++) {
          const fromActivity = dayActivities[i];
          const toActivity = dayActivities[i + 1];

          console.log(
            `🚗 Day ${day.day} 移動 ${i + 1}: ${fromActivity.title} → ${
              toActivity.title
            }`
          );

          const segmentPromise = fetchSingleRouteSegment(
            {
              type: "activity",
              name: fromActivity.location || fromActivity.title,
              searchQuery: fromActivity.search_query,
              id: fromActivity.id,
              title: fromActivity.title,
            },
            {
              type: "activity",
              name: toActivity.location || toActivity.title,
              searchQuery: toActivity.search_query,
              id: toActivity.id,
              title: toActivity.title,
            },
            day.day,
            i,
            tripId,
            totalDistanceTracker
          );

          routePromises.push(segmentPromise);
        }
      }

      // 全ての経路セグメントを並行取得
      console.log(`\n📊 総経路セグメント数: ${routePromises.length}`);

      if (routePromises.length === 0) {
        console.log(
          "⚠️ 経路セグメントがありません。経路データの設定をスキップします。"
        );
        return;
      }

      const routeResults = await Promise.all(routePromises);

      // 結果を整理
      console.log(`\n=== 経路結果の整理 ===`);
      routeResults.forEach((result, index) => {
        console.log(`結果 ${index + 1}:`, {
          success: result?.success,
          day: result?.day,
          segmentIndex: result?.segmentIndex,
          distance: result?.data?.distance_km,
          duration: result?.data?.duration_minutes,
        });

        if (result && result.success) {
          const dayKey = `day_${result.day}`;
          if (!allRouteSegments[dayKey]) {
            allRouteSegments[dayKey] = {
              segments: [],
              dayTotalDistance: 0,
              dayTotalDuration: 0,
              crossDaySegment: null,
            };
          }

          if (result.segmentIndex === "cross_day") {
            // 日跨ぎセグメント
            allRouteSegments[dayKey].crossDaySegment = result.data;
            console.log(`✅ 日跨ぎセグメント設定: Day ${result.day}`, {
              from: result.data.from.title,
              to: result.data.to.title,
              distance: result.data.distance_km,
              duration: result.data.duration_minutes,
            });
          } else {
            // 通常のセグメント
            allRouteSegments[dayKey].segments.push(result.data);
          }

          allRouteSegments[dayKey].dayTotalDistance +=
            result.data.distance_km || 0;
          allRouteSegments[dayKey].dayTotalDuration +=
            result.data.duration_minutes || 0;
        } else {
          console.error("❌ 経路取得失敗:", result);
        }
      });

      // 全体の総移動距離と交通費を計算
      const totalDistance = totalDistanceTracker.total;
      const totalDuration = Object.values(allRouteSegments).reduce(
        (total, day) => total + day.dayTotalDuration,
        0
      );
      const totalTransportationCost = Math.round(totalDistance * 28);

      console.log(`\n=== 最終結果 ===`);
      console.log(`総移動距離: ${Math.round(totalDistance * 10) / 10} km`);
      console.log(`総移動時間: ${totalDuration} 分`);
      console.log(`総交通費: ¥${totalTransportationCost.toLocaleString()}`);

      // 各日の詳細ログ
      Object.keys(allRouteSegments).forEach((dayKey) => {
        const dayData = allRouteSegments[dayKey];
        console.log(`${dayKey}:`, {
          segments: dayData.segments.length,
          crossDay: !!dayData.crossDaySegment,
          totalDistance: Math.round(dayData.dayTotalDistance * 10) / 10,
          totalDuration: dayData.dayTotalDuration,
        });
      });

      // 全体ルート情報を設定
      const finalRouteData = {
        ...allRouteSegments,
        overall: {
          route: {
            distance_km: totalDistance,
            duration_minutes: totalDuration,
            mode: "driving",
            total_cost: totalTransportationCost,
          },
        },
      };

      console.log(`\n📤 setRouteData に設定するデータ:`, finalRouteData);

      setRouteData((prev) => ({
        ...prev,
        [tripId]: finalRouteData,
      }));
    } catch (error) {
      console.error("❌ 詳細経路探索エラー:", error);
    }
  };

  // 単一の経路セグメントを取得（総距離追跡機能付き）
  const fetchSingleRouteSegment = async (
    from,
    to,
    day,
    segmentIndex,
    tripId,
    totalDistanceTracker
  ) => {
    try {
      console.log(`経路セグメント取得: Day ${day}, ${from.name} → ${to.name}`);

      const response = await fetch("/api/directions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: from.searchQuery,
          destination: to.searchQuery,
          mode: "driving",
        }),
      });

      if (!response.ok) {
        throw new Error(`経路取得エラー: ${response.status}`);
      }

      const routeData = await response.json();
      const distance = routeData.distance_km || 0;

      // 総距離に追加
      totalDistanceTracker.total += distance;

      return {
        success: true,
        day: day,
        segmentIndex: segmentIndex,
        tripId: tripId,
        data: {
          from: from,
          to: to,
          distance_km: distance,
          duration_minutes: routeData.duration_minutes || 0,
          polyline: routeData.polyline || "",
          static_map_url: routeData.static_map_url || "",
          directions: routeData.directions || [],
          is_cross_day: segmentIndex === "cross_day",
        },
      };
    } catch (error) {
      console.error(
        `経路セグメント取得エラー (Day ${day}, ${from.name} → ${to.name}):`,
        error
      );
      return {
        success: false,
        day: day,
        segmentIndex: segmentIndex,
        error: error.message,
      };
    }
  };

  // 各日の統合マップを生成
  const generateDayMaps = async (tripId, planData, routeSegments) => {
    try {
      for (const day of planData.itinerary) {
        const dayKey = `day_${day.day}`;
        const daySegments = routeSegments[dayKey];

        if (!daySegments || daySegments.segments.length === 0) {
          console.log(`Day ${day.day}: 経路セグメントなし`);
          continue;
        }

        // その日のすべてのポイントを収集
        const allPoints = [];
        const allPolylines = [];

        daySegments.segments.forEach((segment) => {
          if (!allPoints.some((p) => p.name === segment.from.name)) {
            allPoints.push(segment.from);
          }
          if (!allPoints.some((p) => p.name === segment.to.name)) {
            allPoints.push(segment.to);
          }
          if (segment.polyline) {
            allPolylines.push(segment.polyline);
          }
        });

        // 統合マップを生成
        try {
          const mapResponse = await fetch("/api/generate-day-map", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              waypoints: allPoints.map((p) => p.searchQuery),
              polylines: allPolylines,
              day: day.day,
            }),
          });

          if (mapResponse.ok) {
            const mapData = await mapResponse.json();

            // 既存のrouteDataを更新
            setRouteData((prev) => ({
              ...prev,
              [tripId]: {
                ...prev[tripId],
                [dayKey]: {
                  segments: daySegments.segments,
                  route: {
                    distance_km: daySegments.totalDistance,
                    duration_minutes: daySegments.totalDuration,
                    mode: "driving",
                  },
                  static_map_url: mapData.static_map_url,
                },
              },
            }));
          }
        } catch (error) {
          console.error(`Day ${day.day} マップ生成エラー:`, error);
        }
      }
    } catch (error) {
      console.error("日別マップ生成エラー:", error);
    }
  };

  // 全体ルートを生成
  const generateOverallRoute = async (tripId, planData) => {
    try {
      const majorPoints = planData.itinerary
        .map((day) => ({
          name: day.city?.name || day.accommodation,
          searchQuery: day.city?.name || day.accommodation,
        }))
        .filter((point) => point.searchQuery);

      if (majorPoints.length < 2) return;

      const response = await fetch("/api/directions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          waypoints: majorPoints.map((p) => p.searchQuery),
          optimize: false, // 日程順序を維持
        }),
      });

      if (response.ok) {
        const overallData = await response.json();

        setRouteData((prev) => ({
          ...prev,
          [tripId]: {
            ...prev[tripId],
            overall: {
              route: {
                distance_km: overallData.distance_km,
                duration_minutes: overallData.duration_minutes,
                mode: "driving",
              },
              static_map_url: overallData.static_map_url,
            },
          },
        }));
      }
    } catch (error) {
      console.error("全体ルート生成エラー:", error);
    }
  };

  // 既存のuseEffectの経路取得部分を置き換え
  useEffect(() => {
    if (plans.length === 0 || !isClient) return;

    const fetchData = async () => {
      try {
        // 位置情報とホテル情報の取得
        // ... 既存のホテル・画像取得コード ...

        // 詳細経路情報を取得（新しい実装）
        for (const plan of plans) {
          await fetchDetailedRoutes(plan.trip_id, plan);
        }

        setLoading(false);
      } catch (error) {
        console.error("データ取得エラー:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [plans]);

  const handlePlanSelect = (planIndex) => {
    setSelectedPlan(planIndex);
    setExpandedDay(null);
  };

  const handleConfirmPlan = () => {
    // ホテル情報を含むプランデータを準備
    const planDataWithHotels = {
      ...selectedPlanData,
      hotels: hotels[selectedPlanData.trip_id] || null
    };

    if (startDate && endDate) {
      // 日程が設定されている場合、その情報を含めて確定画面に遷移
      const planWithDates = {
        ...planDataWithHotels,
        travel_dates: {
          startDate: startDate,
          endDate: endDate,
          duration: (() => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            return `${days}日間`;
          })(),
        },
      };
      localStorage.setItem(
        "selectedPlanWithDates",
        JSON.stringify(planWithDates)
      );
      // confirmedPlanにも保存（confirm画面用）
      localStorage.setItem("confirmedPlan", JSON.stringify(planWithDates));
      console.log("プラン確定（日程あり）:", planWithDates);
    } else {
      // 日程が未設定の場合は元のプランデータのみ
      localStorage.setItem(
        "selectedPlanWithDates",
        JSON.stringify(planDataWithHotels)
      );
      // confirmedPlanにも保存（confirm画面用）
      localStorage.setItem("confirmedPlan", JSON.stringify(planDataWithHotels));
      console.log("プラン確定（日程なし）:", planDataWithHotels);
    }
    router.push("/confirm");
  };

  const handleDateConfirm = () => {
    if (!startDate || !endDate) {
      alert("出発日と帰着日を両方選択してください。");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      alert("帰着日は出発日より後の日付を選択してください。");
      return;
    }

    // 日程の差を計算
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const planDuration = selectedPlanData?.hero?.duration || "";
    const expectedDays = parseInt(planDuration.match(/\d+/)?.[0]) || 0;

    if (daysDiff !== expectedDays && expectedDays > 0) {
      if (
        !confirm(
          `プランは${expectedDays}日間ですが、選択された期間は${daysDiff}日間です。このまま続行しますか？`
        )
      ) {
        return;
      }
    }

    setShowDatePicker(false);
    alert(`旅行日程が設定されました: ${startDate} 〜 ${endDate}`);
  };

  const handleRegenerate = () => {
    if (confirm("新しいプランを生成しますか？")) {
      router.push("/");
    }
  };

  const handleRegenerateWithPrompt = async () => {
    if (!additionalPrompt.trim()) {
      alert("追加の要望を入力してください。");
      return;
    }

    setShowRegenerateForm(false);
    setIsRegenerating(true);
    setRegenerationProgress(0);

    let progressInterval;

    try {
      console.log("=== プラン修正開始 ===");
      console.log("選択されたプラン:", selectedPlan);
      console.log("元のプラン ID:", selectedPlanData?.trip_id);
      console.log("修正要望:", additionalPrompt);

      // 進捗シミュレーション
      progressInterval = setInterval(() => {
        setRegenerationProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          const increment = prev < 30 ? 8 : prev < 60 ? 5 : prev < 80 ? 3 : 1;
          return prev + increment;
        });
      }, 800);

      // API呼び出し
      const response = await fetch("/api/modify-travel-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_plan: selectedPlanData,
          plan_number: selectedPlan + 1,
          modification_request: additionalPrompt.trim(),
          full_plans_data: plans,
        }),
      });

      console.log("=== APIレスポンス ===");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("OK:", response.ok);

      // 進捗を100%に
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setRegenerationProgress(100);

      // レスポンステキストを取得
      const responseText = await response.text();
      console.log("=== レスポンステキスト ===");
      console.log("Length:", responseText.length);
      console.log("Preview:", responseText.substring(0, 500));

      if (response.ok) {
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log("=== JSONパース成功 ===");
          console.log("Response keys:", Object.keys(responseData));
          console.log("Success flag:", responseData.success);
        } catch (parseError) {
          console.error("=== JSONパースエラー ===", parseError);
          console.error("Raw response:", responseText);
          throw new Error("サーバーからの応答が無効なJSON形式です");
        }

        // APIレスポンス形式に合わせた検証
        if (!responseData.success) {
          throw new Error("プランの修正に失敗しました");
        }

        if (!responseData.modified_plan) {
          throw new Error("修正されたプランデータが返されませんでした");
        }

        const modifiedPlan = responseData.modified_plan;

        // プランデータの基本検証
        if (!modifiedPlan.trip_id) {
          console.warn("Trip IDが不足しているため、自動生成します");
          modifiedPlan.trip_id = `modified_${
            selectedPlanData.trip_id
          }_${Date.now()}`;
        }

        if (!modifiedPlan.hero) {
          console.warn("Hero情報が不足しているため、元のデータを使用します");
          modifiedPlan.hero = selectedPlanData.hero;
        }

        if (!modifiedPlan.itinerary || !Array.isArray(modifiedPlan.itinerary)) {
          console.warn(
            "Itinerary情報が不足しているため、元のデータを使用します"
          );
          modifiedPlan.itinerary = selectedPlanData.itinerary;
        }

        console.log("=== 修正されたプラン ===");
        console.log("Trip ID:", modifiedPlan.trip_id);
        console.log("Title:", modifiedPlan.hero?.title);
        console.log("Days:", modifiedPlan.itinerary?.length);
        console.log("Summary:", modifiedPlan.modification_summary);

        // 既存のプラン配列を更新（選択されたプランのみを置き換え）
        const updatedPlans = [...plans];
        updatedPlans[selectedPlan] = modifiedPlan;

        console.log("=== プラン配列更新 ===");
        console.log("更新前プラン数:", plans.length);
        console.log("更新後プラン数:", updatedPlans.length);
        console.log("修正対象インデックス:", selectedPlan);

        // ローカルストレージに保存
        localStorage.setItem("travelPlans", JSON.stringify(updatedPlans));

        // 完了処理
        setTimeout(() => {
          setPlans(updatedPlans);
          setSelectedPlan(selectedPlan); // 同じプランを再選択
          setIsRegenerating(false);
          setRegenerationProgress(0);

          const planTitle =
            modifiedPlan.hero?.title || `プラン ${selectedPlan + 1}`;
          const summary =
            modifiedPlan.modification_summary || "要望に基づいて更新されました";

          alert(
            `✅ プラン修正完了\n\n「${planTitle}」\n\n修正内容: ${summary}`
          );
        }, 1000);
      } else {
        // エラーレスポンスの処理
        console.error("=== APIエラー ===");
        console.error("Status:", response.status);
        console.error("Response:", responseText);

        let errorMessage = "プランの修正に失敗しました。";

        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            console.error("Error details:", errorData.details);
            errorMessage += `\n詳細: ${errorData.details}`;
          }
        } catch {
          // JSON パースに失敗した場合のエラーハンドリング
          if (response.status === 429) {
            errorMessage =
              "リクエストが多すぎます。しばらく待ってから再試行してください。";
          } else if (response.status === 401) {
            errorMessage =
              "API認証エラーが発生しました。管理者にお問い合わせください。";
          } else if (response.status === 500) {
            errorMessage =
              "サーバー内部エラーが発生しました。しばらく待ってから再試行してください。";
          } else {
            errorMessage += ` (HTTP ${response.status})`;
          }
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("=== プラン修正エラー (全体) ===", error);

      let userMessage = "プランの修正中にエラーが発生しました。";

      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        userMessage =
          "ネットワーク接続に問題があります。インターネット接続を確認してください。";
      } else if (
        error.message.includes("JSON") ||
        error.message.includes("parse")
      ) {
        userMessage =
          "サーバーからの応答形式に問題があります。しばらく待ってから再試行してください。";
      } else if (error.message.includes("API認証")) {
        userMessage =
          "サービスの認証に問題があります。管理者にお問い合わせください。";
      } else if (error.message.includes("リクエストが多すぎます")) {
        userMessage =
          "リクエストが多すぎます。1分ほど待ってから再試行してください。";
      } else if (error.message.includes("サーバー内部エラー")) {
        userMessage =
          "サーバーで問題が発生しています。しばらく待ってから再試行してください。";
      } else if (error.message) {
        userMessage = error.message;
      }

      alert(`❌ エラー\n\n${userMessage}`);
    } finally {
      // 確実にクリーンアップ
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsRegenerating(false);
      setRegenerationProgress(0);
      setAdditionalPrompt("");
    }
  };

  // キャンセル処理
  const handleRegenerationCancel = () => {
    setIsRegenerating(false);
    setRegenerationProgress(0);
    setShowRegenerateForm(true);
  };

  // 共有リンクをコピーする機能
  const handleCopyShareLink = async () => {
    const currentUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(currentUrl);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error("コピーに失敗しました:", err);
      // フォールバック: テキストを選択状態にする
      const textArea = document.createElement("textarea");
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error("フォールバックも失敗しました:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            プランを準備中...
          </h2>
          <p className="text-gray-600">位置情報とホテル情報を取得しています</p>
        </div>
      </div>
    );
  }

  const handleBookingClick = (type) => {
    console.log(`${type}の予約を開始`);
  };

  const selectedPlanData = selectedPlan !== null ? plans[selectedPlan] : null;

  // SSR中またはプランデータがない場合のローディング表示
  if (!isClient || authLoading || loading || !planId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">
            {!isClient
              ? "読み込み中..."
              : authLoading
              ? "認証状態を確認中..."
              : !planId
              ? "プランIDを取得中..."
              : "プランデータを確認中..."}
          </p>
          <p className="text-gray-500 text-sm">
            planId: {planId || "取得中..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 進捗モーダル */}
      <ProgressModalDynamic
        isVisible={isRegenerating}
        progress={regenerationProgress}
        totalPlans={1}
        onCancel={handleRegenerationCancel}
        customTitle="プランをカスタマイズ中..."
        customSubtitle="あなたの要望を反映した新しいプランを生成しています"
      />

      {/* 追加データ読み込み中のモーダル */}
      <ProgressModalDynamic
        isVisible={additionalDataLoading}
        progress={additionalDataProgress}
        totalPlans={1}
        onCancel={() => {}} // キャンセル不可
        customTitle="詳細情報を読み込み中..."
        customSubtitle="画像・マップ・ホテル情報を取得しています"
      />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                旅行プラン提案
              </h1>
              <p className="text-gray-600">
                あなたに最適な3つのプランをご用意しました
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRegenerate}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                新しいプランを生成
              </button>
              <UserProfile />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ユーザー向け案内 - 未認証時 */}
        {!currentUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  プランが生成されました！
                </h3>
                <p className="text-blue-800 text-sm mb-3">
                  プランの概要はご覧いただけますが、詳細な情報（ホテル、ルート、アクティビティの詳細など）を見るにはログインが必要です。
                </p>
                <button
                  onClick={() => router.push("/login?redirect=%2Fplans")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  ログインして詳細を見る
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans && plans.length > 0 ? (
            plans
              .filter((plan) => plan && plan.hero)
              .map((plan, index) => (
                <div
                  key={plan.trip_id || index}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                    selectedPlan === index
                      ? "ring-4 ring-blue-500 ring-opacity-50"
                      : "hover:shadow-xl"
                  }`}
                  onClick={() => handlePlanSelect(index)}
                >
                  <div className="relative h-48">
                    <img
                      src={
                        heroImages[plan.trip_id]?.photo_url ||
                        plan.hero?.hero_image ||
                        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop"
                      }
                      alt={plan.hero?.title || "プラン画像"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          plan.hero?.hero_image ||
                          "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {plan.hero?.title || "プラン名未設定"}
                      </h3>
                      <p className="text-gray-200 text-sm">
                        {plan.hero?.subtitle || ""}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-blue-600 font-semibold">
                        {(() => {
                          if (plan.hero?.duration) {
                            return plan.hero.duration;
                          } else if (
                            plan.itinerary &&
                            plan.itinerary.length > 0
                          ) {
                            return `${plan.itinerary.length}日間`;
                          } else {
                            return "期間未設定";
                          }
                        })()}
                      </span>
                      <span className="text-purple-600 font-semibold">
                        {plan.hero?.budget || "予算未設定"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {(plan.hero?.highlights || [])
                        .slice(0, 2)
                        .map((highlight, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                          >
                            {highlight}
                          </span>
                        ))}
                      {(plan.hero?.highlights || []).length > 2 && (
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          +{(plan.hero?.highlights || []).length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        📍 {plan.hero?.destination || "目的地未設定"}
                      </span>
                      {selectedPlan === index && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                          選択中
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-500">プランデータを読み込み中...</p>
            </div>
          )}
        </div>

        {/* Selected Plan Details */}
        {selectedPlanData && !isRegenerating && (
          <BlurredContent isAuthenticated={!!currentUser} title="詳細なプラン">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Detailed Itinerary */}
                <div className="space-y-8">
                  {selectedPlanData.itinerary.map((day, dayIndex) => (
                    <div
                      key={day.day}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden"
                    >
                      {/* Day Header */}
                      <div className="relative h-32 sm:h-40">
                        <img
                          src={
                            dayImages[selectedPlanData.trip_id]?.[day.day]
                              ?.photo_url || day.city.image
                          }
                          alt={day.city.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = day.city.image; // フォールバック
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-2xl font-bold text-white">
                            Day {day.day}
                          </h3>
                          <p className="text-lg text-gray-200">
                            {day.city.name} - {day.city.description}
                          </p>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="p-6">
                        <div className="space-y-6">
                          {day.activities.map((activity, activityIndex) => (
                            <div
                              key={activity.id}
                              className="border border-gray-100 rounded-lg p-4"
                            >
                              <div className="flex flex-col sm:flex-row gap-6">
                                <div className="sm:w-48 flex-shrink-0">
                                  <img
                                    src={
                                      activityImages[
                                        selectedPlanData.trip_id
                                      ]?.[activity.id]?.photo_url ||
                                      activity.image
                                    }
                                    alt={activity.title}
                                    className="w-full h-32 sm:h-36 object-cover rounded-lg"
                                    onError={(e) => {
                                      e.target.src = activity.image; // フォールバック
                                    }}
                                  />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <span className="text-blue-600 font-semibold text-lg">
                                          {activity.time}
                                        </span>
                                        <span
                                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            activity.priority === "must_see"
                                              ? "bg-red-100 text-red-700"
                                              : activity.priority === "must_do"
                                              ? "bg-orange-100 text-orange-700"
                                              : "bg-green-100 text-green-700"
                                          }`}
                                        >
                                          {activity.priority === "must_see"
                                            ? "必見"
                                            : activity.priority === "must_do"
                                            ? "必須"
                                            : "おすすめ"}
                                        </span>
                                      </div>
                                      <h4 className="text-xl font-bold text-gray-900 mb-1">
                                        {activity.title}
                                      </h4>
                                      <p className="text-gray-600 font-medium mb-2">
                                        {activity.subtitle}
                                      </p>
                                    </div>
                                  </div>

                                  <p className="text-gray-700 mb-4 leading-relaxed">
                                    {activity.description}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <div className="flex items-center">
                                      <span className="text-gray-500 mr-1">
                                        📍
                                      </span>
                                      <span className="text-gray-700">
                                        {activity.location}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-gray-500 mr-1">
                                        💰
                                      </span>
                                      <span className="text-gray-700 font-medium">
                                        {activity.price}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-yellow-500 mr-1">
                                        ⭐
                                      </span>
                                      <span className="text-gray-700 font-medium">
                                        {activity.rating}
                                      </span>
                                    </div>
                                  </div>

                                  {activity.tips && (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                      <p className="text-yellow-800">
                                        <span className="font-medium">
                                          💡 Tip:{" "}
                                        </span>
                                        {activity.tips}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 1日の経路マップ */}
                        {routeData[selectedPlanData.trip_id]?.[
                          `day_${day.day}`
                        ] ? (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                              <span className="mr-2">🗺️</span>
                              Day {day.day} の移動ルート
                            </h5>
                            <InteractiveMap
                              staticMapUrl={
                                routeData[selectedPlanData.trip_id][
                                  `day_${day.day}`
                                ].static_map_url
                              }
                              routeInfo={
                                routeData[selectedPlanData.trip_id][
                                  `day_${day.day}`
                                ]
                              }
                              height="250px"
                            />
                          </div>
                        ) : (
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-yellow-600 mr-2">⚠️</span>
                              <div>
                                <p className="text-yellow-800 font-medium">
                                  Day {day.day} の経路情報を取得中
                                </p>
                                <p className="text-yellow-700 text-sm">
                                  {day.activities.length > 0
                                    ? `${day.activities.length}箇所のスポット間の最適ルートを計算しています...`
                                    : "このエリアの移動情報を準備中です..."}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 当日の宿泊先 */}
                        {day.accommodation &&
                          day.accommodation !== "出発日のため宿泊なし" && (
                            <div className="mt-6">
                              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                <span className="mr-2">🏨</span>
                                Day {day.day} の宿泊先
                              </h5>
                              {hotels[selectedPlanData.trip_id]?.[
                                `day_${day.day}`
                              ] &&
                              hotels[selectedPlanData.trip_id][`day_${day.day}`]
                                .length > 0 ? (
                                <div className="space-y-3">
                                  {hotels[selectedPlanData.trip_id][
                                    `day_${day.day}`
                                  ]
                                    .slice(0, 2)
                                    .map((hotel, hotelIndex) => (
                                      <div
                                        key={hotelIndex}
                                        className="bg-blue-50 rounded-lg p-4 border border-blue-200"
                                      >
                                        <div className="flex items-start space-x-3">
                                          <img
                                            src={hotel.image}
                                            alt={hotel.name}
                                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <h6 className="font-semibold text-gray-900 text-sm mb-1">
                                              {hotel.name}
                                            </h6>
                                            <p className="text-xs text-gray-600 mb-2 flex items-center">
                                              <span className="mr-1">📍</span>
                                              {hotel.location}
                                            </p>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-2">
                                                <div className="flex text-yellow-400 text-xs">
                                                  {[...Array(5)].map((_, i) => (
                                                    <span
                                                      key={i}
                                                      className={
                                                        i <
                                                        Math.floor(hotel.rating)
                                                          ? "text-yellow-400"
                                                          : "text-gray-300"
                                                      }
                                                    >
                                                      ⭐
                                                    </span>
                                                  ))}
                                                </div>
                                                <span className="text-xs text-gray-600">
                                                  {hotel.rating}
                                                </span>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-sm font-semibold text-blue-600">
                                                  {hotel.price}
                                                </div>
                                                <a
                                                  href={hotel.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-500 hover:text-blue-700 underline"
                                                >
                                                  詳細を見る
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  {hotels[selectedPlanData.trip_id][
                                    `day_${day.day}`
                                  ].length > 2 && (
                                    <p className="text-xs text-gray-500 text-center">
                                      他に
                                      {hotels[selectedPlanData.trip_id][
                                        `day_${day.day}`
                                      ].length - 2}
                                      件のホテルがあります
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {day.accommodation}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                          宿泊エリア
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-gray-700">
                                          予算目安: ¥8,000〜
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* 旅行の豆知識 */}
                                  <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                                    <div className="flex items-center mb-2">
                                      <span className="text-lg mr-2">💡</span>
                                      <p className="text-sm font-semibold text-blue-900">
                                        旅行の豆知識
                                      </p>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {(() => {
                                        const tips = [
                                          "日本の温泉に入る前は必ずかけ湯をして体を清めましょう。心身ともにリフレッシュできます。",
                                          "地元の郷土料理を味わうことで、その土地の文化と歴史を感じることができます。",
                                          "神社参拝では、参道の中央は神様の通り道なので端を歩くのがマナーです。",
                                          "旅先での出会いを大切に。地元の方との会話から新しい発見があることも。",
                                          "季節ごとの風景を楽しみましょう。日本の四季はそれぞれ特別な美しさがあります。"
                                        ];
                                        const randomTip = tips[Math.floor(Math.random() * tips.length)];
                                        return randomTip;
                                      })()}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}

                  {/* Interactive Route Map */}
                  {routeData[selectedPlanData.trip_id]?.overall && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        全体旅行ルート
                      </h3>
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <InteractiveMap
                          staticMapUrl={
                            routeData[selectedPlanData.trip_id].overall
                              .static_map_url
                          }
                          routeInfo={
                            routeData[selectedPlanData.trip_id].overall.route
                          }
                          height="300px"
                        />
                      </div>
                    </div>
                  )}

                  {/* Recommended Hotels */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      おすすめホテル
                    </h3>
                    {hotels[selectedPlanData.trip_id] &&
                    Object.keys(hotels[selectedPlanData.trip_id]).length > 0 ? (
                      <div className="space-y-6">
                        {Object.entries(hotels[selectedPlanData.trip_id]).map(
                          ([dayKey, dayHotels]) => {
                            const dayNumber = dayKey.replace("day_", "");
                            const dayData = selectedPlanData.itinerary.find(
                              (d) => d.day === parseInt(dayNumber)
                            );

                            if (!dayHotels || dayHotels.length === 0)
                              return null;

                            return (
                              <div
                                key={dayKey}
                                className="bg-gray-50 rounded-xl p-4"
                              >
                                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                  <span className="mr-2">🏨</span>
                                  Day {dayNumber} ({dayData?.accommodation})
                                  のホテル
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {dayHotels.slice(0, 6).map((hotel, index) => (
                                    <div
                                      key={`${dayKey}-${index}`}
                                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                                    >
                                      <div className="relative">
                                        <img
                                          src={hotel.image}
                                          alt={hotel.name}
                                          className="w-full h-32 object-cover"
                                        />
                                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                          Day {dayNumber}
                                        </div>
                                      </div>
                                      <div className="p-4">
                                        <h5 className="font-bold text-gray-900 mb-2 text-sm leading-tight">
                                          {hotel.name}
                                        </h5>
                                        <p className="text-xs text-gray-600 mb-2 flex items-center">
                                          <span className="mr-1">📍</span>
                                          {hotel.location}
                                        </p>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-1">
                                            <div className="flex text-yellow-400 text-xs">
                                              {[...Array(5)].map((_, i) => (
                                                <span
                                                  key={i}
                                                  className={
                                                    i < Math.floor(hotel.rating)
                                                      ? "text-yellow-400"
                                                      : "text-gray-300"
                                                  }
                                                >
                                                  ⭐
                                                </span>
                                              ))}
                                            </div>
                                            <span className="text-xs text-gray-600">
                                              {hotel.rating} (
                                              {hotel.reviewCount}件)
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-bold text-blue-600">
                                            {hotel.price}
                                          </span>
                                          <a
                                            href={hotel.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                                          >
                                            詳細
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* {dayHotels.length > 6 && (
                                  <p className="text-sm text-gray-500 text-center mt-3">
                                    他に{dayHotels.length - 6}
                                    件のホテルがあります
                                  </p>
                                )} */}
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <span className="text-yellow-600 mr-2">⚠️</span>
                          <p className="text-yellow-800">
                            この地域のホテル情報を取得中です。しばらくお待ちください。
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location Information */}
                  {/* {locationData[selectedPlanData.hero.title] && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        エリア情報
                      </h3>
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {locationData[selectedPlanData.hero.title]
                            .map_image_url && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="mr-2">🗺️</span>
                                位置情報
                              </h4>
                              <div className="relative group">
                                <img
                                  src={
                                    locationData[selectedPlanData.hero.title]
                                      .map_image_url
                                  }
                                  alt={`${selectedPlanData.hero.title}の地図`}
                                  className="w-full h-48 object-cover rounded-lg cursor-pointer group-hover:opacity-90 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                                  <span className="text-white font-medium">
                                    Google Mapsで開く
                                  </span>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    selectedPlanData.hero.title
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0"
                                >
                                  <span className="sr-only">
                                    Google Mapsで{selectedPlanData.hero.title}
                                    を開く
                                  </span>
                                </a>
                              </div>
                            </div>
                          )}
                          {locationData[selectedPlanData.hero.title]
                            .photo_url && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="mr-2">📸</span>
                                現地の風景
                              </h4>
                              <img
                                src={
                                  locationData[selectedPlanData.hero.title]
                                    .photo_url
                                }
                                alt={selectedPlanData.hero.title}
                                className="w-full h-48 object-cover rounded-lg shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-600 mt-0.5">📍</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                住所
                              </p>
                              <p className="text-sm text-gray-600">
                                {
                                  locationData[selectedPlanData.hero.title]
                                    .formatted_address
                                }
                              </p>
                            </div>
                          </div>
                          {locationData[selectedPlanData.hero.title]
                            .coordinates && (
                            <div className="flex items-start space-x-2 mt-3">
                              <span className="text-green-600 mt-0.5">🌐</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  座標
                                </p>
                                <p className="text-sm text-gray-600">
                                  {locationData[
                                    selectedPlanData.hero.title
                                  ].coordinates.lat.toFixed(6)}
                                  ,{" "}
                                  {locationData[
                                    selectedPlanData.hero.title
                                  ].coordinates.lng.toFixed(6)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 mt-8 lg:mt-0">
                <div className="sticky top-8 space-y-6">
                  {/* Plan Summary */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      📋 プラン概要
                    </h3>
                    {!startDate && !endDate && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          💡 日程未設定でも、AIが最適な
                          {selectedPlanData.itinerary
                            ? selectedPlanData.itinerary.length
                            : 0}
                          日間のプランを作成しました
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">期間</span>
                        {startDate && endDate ? (
                          <div className="text-right">
                            <div className="font-medium text-blue-600">
                              {new Date(startDate).toLocaleDateString("ja-JP", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              〜{" "}
                              {new Date(endDate).toLocaleDateString("ja-JP", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const start = new Date(startDate);
                                const end = new Date(endDate);
                                const days =
                                  Math.ceil(
                                    (end - start) / (1000 * 60 * 60 * 24)
                                  ) + 1;
                                return `${days}日間の旅程`;
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className="font-medium text-gray-700">
                              {selectedPlanData.hero.duration}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(() => {
                                // itineraryの日数から実際の旅行日数を表示
                                const actualDays = selectedPlanData.itinerary
                                  ? selectedPlanData.itinerary.length
                                  : 0;
                                return actualDays > 0
                                  ? `${actualDays}日間のプラン`
                                  : "日程未設定";
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">予算目安</span>
                        <span className="font-medium">
                          {selectedPlanData.hero.budget}
                        </span>
                      </div>
                      {startDate && endDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">旅行日程</span>
                          <span className="font-medium text-blue-600">
                            {startDate} 〜 {endDate}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 日程選択フォーム */}
                    {showDatePicker && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">
                          旅行日程を選択
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              出発日
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              帰着日
                            </label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              min={
                                startDate ||
                                new Date().toISOString().split("T")[0]
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleDateConfirm}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              確定
                            </button>
                            <button
                              onClick={() => setShowDatePicker(false)}
                              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleConfirmPlan}
                      className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                    >
                      <span>プランを確定する</span>
                      <svg
                        className="w-5 h-5 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* プランカスタマイズ */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">✨</span>
                      プランをカスタマイズ
                    </h3>
                    <p className="text-gray-600 mb-6">
                      現在のプランをベースに、あなたの追加の要望を反映した新しいプランを生成できます。
                    </p>

                    {!showRegenerateForm ? (
                      <button
                        onClick={() => setShowRegenerateForm(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                      >
                        <span className="mr-2">🎯</span>
                        プランをカスタマイズする
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            追加の要望やリクエスト
                          </label>
                          <textarea
                            value={additionalPrompt}
                            onChange={(e) => setAdditionalPrompt(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            rows="4"
                            placeholder="例: もっと自然を楽しめるスポットを追加してください、予算を抑えたい、子供向けの施設を含めてください、など"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleRegenerateWithPrompt}
                            disabled={!additionalPrompt.trim()}
                            className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <span className="mr-2">🚀</span>
                            新しいプランを生成
                          </button>
                          <button
                            onClick={() => {
                              setShowRegenerateForm(false);
                              setAdditionalPrompt("");
                            }}
                            className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* プラン共有 */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🔗</span>
                      プランを共有
                    </h3>
                    <p className="text-gray-600 mb-6">
                      このプランを家族や友人と共有して、一緒に旅行の計画を立てましょう。
                    </p>
                    
                    <div className="relative">
                      <button
                        onClick={handleCopyShareLink}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                          />
                        </svg>
                        <span>共有リンクをコピー</span>
                      </button>
                      {showCopySuccess && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg whitespace-nowrap z-50">
                          リンクをコピーしました！
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  {/* <CostBreakdown 
                  plan={selectedPlanData}
                  routeData={routeData[selectedPlanData.trip_id]}
                  hotels={hotels[selectedPlanData.trip_id]}
                /> */}
                </div>
              </div>
            </div>
          </BlurredContent>
        )}

        {/* Empty State */}
        {selectedPlan === null && !isRegenerating && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              プランを選択してください
            </h3>
            <p className="text-gray-600">
              上記のカードから気に入ったプランをクリックして詳細をご覧ください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 画像取得の関数を修正してフォールバックを改善
const fetchActivityImages = async (tripId, planData) => {
  try {
    const imagePromises = [];

    for (const day of planData.itinerary) {
      for (const activity of day.activities) {
        const imagePromise = fetch("/api/search-images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query:
              activity.image_search_term ||
              `${activity.title} ${day.city?.name || ""}`,
            type: "activity",
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => ({
            activityId: activity.id,
            imageUrl:
              data?.imageUrl ||
              `https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop&crop=center`, // デフォルト画像
          }))
          .catch(() => ({
            activityId: activity.id,
            imageUrl: `https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop&crop=center`, // エラー時のデフォルト画像
          }));

        imagePromises.push(imagePromise);
      }
    }

    const imageResults = await Promise.all(imagePromises);
    const imageMap = {};

    imageResults.forEach((result) => {
      if (result.activityId) {
        imageMap[result.activityId] = result.imageUrl;
      }
    });

    setActivityImages((prev) => ({
      ...prev,
      [tripId]: imageMap,
    }));
  } catch (error) {
    console.error("アクティビティ画像取得エラー:", error);
  }
};

const fetchHeroImages = async (tripId, planData) => {
  try {
    const response = await fetch("/api/search-images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${planData.hero?.destination || ""} travel landscape`,
        type: "hero",
      }),
    });

    let imageUrl = `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=600&fit=crop&crop=center`; // デフォルト画像

    if (response.ok) {
      const data = await response.json();
      if (data?.imageUrl) {
        imageUrl = data.imageUrl;
      }
    }

    setHeroImages((prev) => ({
      ...prev,
      [tripId]: imageUrl,
    }));
  } catch (error) {
    console.error("ヒーロー画像取得エラー:", error);
    // エラー時もデフォルト画像を設定
    setHeroImages((prev) => ({
      ...prev,
      [tripId]: `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=600&fit=crop&crop=center`,
    }));
  }
};

// fetchDayImages関数の修正
const fetchDayImages = async (tripId, planData) => {
  try {
    const imagePromises = planData.itinerary.map(async (day) => {
      try {
        const response = await fetch("/api/search-images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `${
              day.city?.name || planData.hero?.destination || ""
            } cityscape`,
            type: "city",
          }),
        });

        let imageUrl = `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop&crop=center`; // デフォルト画像

        if (response.ok) {
          const data = await response.json();
          if (data?.imageUrl) {
            imageUrl = data.imageUrl;
          }
        }

        return {
          day: day.day,
          imageUrl: imageUrl,
        };
      } catch {
        return {
          day: day.day,
          imageUrl: `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop&crop=center`,
        };
      }
    });

    const imageResults = await Promise.all(imagePromises);
    const imageMap = {};

    imageResults.forEach((result) => {
      // 修正: day番号で直接保存
      imageMap[result.day] = {
        photo_url: result.imageUrl,
      };
    });

    setDayImages((prev) => ({
      ...prev,
      [tripId]: imageMap,
    }));
  } catch (error) {
    console.error("日別画像取得エラー:", error);
  }
};
