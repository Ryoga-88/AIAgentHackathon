"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import UserProfile from "../../components/Auth/UserProfile";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import {
  getLocationData,
  extractLocationsFromPlan,
  getMultipleLocationsData,
  enrichPlanWithLocationData,
} from "../../utils/locationUtils";
import InteractiveMap from "../../components/InteractiveMap";

export default function MyPage() {
  const {
    currentUser,
    logout,
    updateUserProfile,
    getUserPreferences,
    updateUserPreferences,
  } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [travelHistory, setTravelHistory] = useState([]);
  const [selectedHistoryPlan, setSelectedHistoryPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState({});
  const [locationData, setLocationData] = useState({});
  const [activityImages, setActivityImages] = useState({});
  const [heroImages, setHeroImages] = useState({});
  const [dayImages, setDayImages] = useState({});
  const [routeData, setRouteData] = useState({});
  const [userPreferences, setUserPreferences] = useState({
    defaultBudget: 50000,
    preferredDuration: 3,
    interests: [],
    notifications: {
      email: true,
      push: false,
      marketing: false,
    },
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // 認証チェック
  useEffect(() => {
    if (!currentUser) {
      router.push("/login?redirect=%2Fmypage");
    }
  }, [currentUser, router]);

  // Firebaseからユーザーの旅行プランを取得
  const fetchUserTravelPlans = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Firestoreからユーザーの旅行プランを取得
      // インデックスエラーを避けるため、まずuser_idでフィルタし、後でソート
      const q = query(
        collection(db, "travel_plans"),
        where("user_id", "==", currentUser.uid),
        limit(100) // 適度な制限を設ける
      );

      const querySnapshot = await getDocs(q);
      const userPlans = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // そのユーザーが作成したプランのみ
        if (
          data.user_id === currentUser.uid &&
          data.plans &&
          Array.isArray(data.plans)
        ) {
          data.plans.forEach((plan, planIndex) => {
            userPlans.push({
              ...plan,
              firestore_id: doc.id,
              created_at: data.created_at,
              cached_data: data.cached_data,
              plan_index_in_doc: planIndex, // ドキュメント内でのプランのインデックス
            });
          });
        }
      });

      // クライアントサイドで日付順にソート
      userPlans.sort((a, b) => {
        try {
          const dateA = a.created_at?.toDate
            ? a.created_at.toDate()
            : new Date(a.created_at || 0);
          const dateB = b.created_at?.toDate
            ? b.created_at.toDate()
            : new Date(b.created_at || 0);
          return dateB - dateA; // 新しい順
        } catch (error) {
          console.error("ソートエラー:", error);
          return 0;
        }
      });

      console.log("取得したユーザープラン:", userPlans);
      setTravelHistory(userPlans);
    } catch (error) {
      console.error("旅行プラン取得エラー:", error);
      // エラーの場合はLocalStorageから取得
      const storedPlans = localStorage.getItem("travelPlans");
      if (storedPlans) {
        const plans = JSON.parse(storedPlans);
        const history = Array.isArray(plans.plans)
          ? plans.plans
          : Array.isArray(plans)
          ? plans
          : [];
        setTravelHistory(history);
      }
    } finally {
      setLoading(false);
    }
  };

  // 旅行履歴を取得
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          // Firestoreからユーザー設定を取得
          const preferences = await getUserPreferences();
          if (Object.keys(preferences).length > 0) {
            setUserPreferences(preferences);
          }

          // Firebaseから旅行プランを取得
          await fetchUserTravelPlans();
        } catch (error) {
          console.error("ユーザーデータ取得エラー:", error);
          // エラーの場合はLocalStorageから取得
          const storedPreferences =
            JSON.parse(
              localStorage.getItem(`userPreferences_${currentUser.uid}`)
            ) || userPreferences;
          setUserPreferences(storedPreferences);
        }
      }
    };

    loadUserData();
  }, [currentUser, getUserPreferences]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditData({
      displayName: currentUser.displayName || "",
      email: currentUser.email || "",
    });
  };

  const handleSaveProfile = async () => {
    try {
      // Firebaseプロフィール更新
      await updateUserProfile(editData);
      setIsEditing(false);
      alert("プロフィールを更新しました");
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      alert("プロフィール更新に失敗しました");
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...userPreferences, [key]: value };
    setUserPreferences(newPreferences);

    try {
      // Firestoreに保存
      await updateUserPreferences(newPreferences);
    } catch (error) {
      console.error("設定保存エラー:", error);
      // エラーの場合はLocalStorageに保存
      localStorage.setItem(
        `userPreferences_${currentUser.uid}`,
        JSON.stringify(newPreferences)
      );
    }
  };

  const handleInterestToggle = (interest) => {
    const currentInterests = userPreferences.interests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];

    handlePreferenceChange("interests", newInterests);
  };

  // プラン詳細表示時に動的にデータを取得
  const handlePlanDetailView = async (plan, planIndex) => {
    setSelectedHistoryPlan(planIndex);
    setShowPlanModal(true);
    setExpandedDay(null);

    // キャッシュデータがある場合は使用
    if (plan.cached_data) {
      if (plan.cached_data.hotels) setHotels(plan.cached_data.hotels);
      if (plan.cached_data.locationData)
        setLocationData(plan.cached_data.locationData);
      if (plan.cached_data.activityImages)
        setActivityImages(plan.cached_data.activityImages);
      if (plan.cached_data.heroImages)
        setHeroImages(plan.cached_data.heroImages);
      if (plan.cached_data.dayImages) setDayImages(plan.cached_data.dayImages);
      if (plan.cached_data.routeData) setRouteData(plan.cached_data.routeData);
      return;
    }

    // キャッシュがない場合は動的に取得
    try {
      setLoading(true);

      // 位置情報を取得
      const locations = extractLocationsFromPlan([plan]);
      if (locations.length > 0) {
        const locationsData = await getMultipleLocationsData(locations);
        setLocationData(locationsData);
      }

      // 画像を取得
      if (plan.itinerary && Array.isArray(plan.itinerary)) {
        const imagePromises = [];
        const heroImagePromises = [];

        // アクティビティ画像
        plan.itinerary.forEach((day) => {
          if (day.activities && Array.isArray(day.activities)) {
            day.activities.forEach((activity) => {
              if (activity.image_search_term) {
                imagePromises.push(
                  fetch("/api/search-images", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: activity.image_search_term }),
                  })
                    .then((res) => res.json())
                    .then((data) => ({
                      id: activity.id,
                      ...data,
                    }))
                );
              }
            });
          }
        });

        // ヒーロー画像
        if (plan.hero?.destination) {
          heroImagePromises.push(
            fetch("/api/search-images", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `${plan.hero.destination} travel destination`,
              }),
            })
              .then((res) => res.json())
              .then((data) => ({
                id: plan.trip_id,
                ...data,
              }))
          );
        }

        // 画像を並行取得
        const [activityImagesResults, heroImagesResults] = await Promise.all([
          Promise.allSettled(imagePromises),
          Promise.allSettled(heroImagePromises),
        ]);

        // 結果を処理
        const newActivityImages = {};
        const newHeroImages = {};

        activityImagesResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value.id) {
            newActivityImages[result.value.id] = result.value;
          }
        });

        heroImagesResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value.id) {
            newHeroImages[result.value.id] = result.value;
          }
        });

        setActivityImages(newActivityImages);
        setHeroImages(newHeroImages);
      }

      // 経路データを取得
      if (plan.itinerary && Array.isArray(plan.itinerary)) {
        const routePromises = [];

        plan.itinerary.forEach((day) => {
          if (
            day.activities &&
            Array.isArray(day.activities) &&
            day.activities.length > 1
          ) {
            const validActivities = day.activities.filter(
              (activity) =>
                activity.search_query && activity.search_query.trim() !== ""
            );

            if (validActivities.length > 1) {
              const waypoints = validActivities.map(
                (activity) => activity.search_query
              );

              routePromises.push(
                fetch("/api/directions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ waypoints }),
                })
                  .then((res) => res.json())
                  .then((data) => ({
                    key: `day_${day.day}_${plan.trip_id}`,
                    data,
                  }))
                  .catch((err) => {
                    console.error(`経路取得エラー (Day ${day.day}):`, err);
                    return null;
                  })
              );
            }
          }
        });

        const routeResults = await Promise.allSettled(routePromises);
        const newRouteData = {};

        routeResults.forEach((result) => {
          if (
            result.status === "fulfilled" &&
            result.value &&
            result.value.key
          ) {
            newRouteData[result.value.key] = result.value.data;
          }
        });

        setRouteData(newRouteData);
      }
    } catch (error) {
      console.error("動的データ取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setShowPlanModal(false);
    setSelectedHistoryPlan(null);
    setExpandedDay(null);
  };

  const interests = [
    { id: "heritage", label: "歴史・文化", icon: "🏛️" },
    { id: "nature", label: "自然・景色", icon: "🌸" },
    { id: "food", label: "グルメ", icon: "🍜" },
    { id: "entertainment", label: "エンターテイメント", icon: "🎭" },
    { id: "experience", label: "体験・アクティビティ", icon: "🎨" },
    { id: "shopping", label: "ショッピング", icon: "🛍️" },
    { id: "relaxation", label: "リラクゼーション", icon: "♨️" },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                ホームに戻る
              </button>
              <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt="プロフィール"
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentUser.displayName || "ゲスト"}
                  </h2>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "profile"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>👤</span>
                    <span>プロフィール</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "history"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>📅</span>
                    <span>旅行履歴</span>
                  </div>
                </button>

                {/* <button
                  onClick={() => setActiveTab("preferences")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "preferences"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>⚙️</span>
                    <span>設定・好み</span>
                  </div>
                </button> */}

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span>🚪</span>
                    <span>ログアウト</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    プロフィール情報
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={handleEditProfile}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      編集
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        表示名
                      </label>
                      <input
                        type="text"
                        value={editData.displayName}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            displayName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス
                      </label>
                      <input
                        type="email"
                        value={editData.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        メールアドレスの変更はサポートにお問い合わせください
                      </p>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          表示名
                        </label>
                        <p className="text-lg text-gray-900">
                          {currentUser.displayName || "未設定"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          メールアドレス
                        </label>
                        <p className="text-lg text-gray-900">
                          {currentUser.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          アカウント作成日
                        </label>
                        <p className="text-lg text-gray-900">
                          {currentUser.metadata?.creationTime
                            ? new Date(
                                currentUser.metadata.creationTime
                              ).toLocaleDateString("ja-JP")
                            : "不明"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最終ログイン
                        </label>
                        <p className="text-lg text-gray-900">
                          {currentUser.metadata?.lastSignInTime
                            ? new Date(
                                currentUser.metadata.lastSignInTime
                              ).toLocaleDateString("ja-JP")
                            : "不明"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Travel History Tab */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      旅行履歴
                    </h3>
                    <button
                      onClick={fetchUserTravelPlans}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? "更新中..." : "履歴を更新"}
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">プランを読み込み中...</p>
                    </div>
                  ) : travelHistory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {travelHistory.map((trip, index) => (
                        <div
                          key={`${trip.firestore_id || "local"}_${
                            trip.trip_id || index
                          }_${index}`}
                          className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                          onClick={() => handlePlanDetailView(trip, index)}
                        >
                          <div className="relative h-48">
                            <img
                              src={
                                heroImages[trip.trip_id]?.photo_url ||
                                trip.hero?.hero_image ||
                                "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop"
                              }
                              alt={trip.hero?.title || "プラン画像"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  trip.hero?.hero_image ||
                                  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h4 className="text-xl font-bold text-white mb-1">
                                {trip.hero?.title || `旅行プラン ${index + 1}`}
                              </h4>
                              <p className="text-gray-200 text-sm">
                                {trip.hero?.subtitle || ""}
                              </p>
                            </div>
                          </div>

                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-blue-600 font-semibold">
                                {(() => {
                                  if (trip.hero?.duration) {
                                    return trip.hero.duration;
                                  } else if (
                                    trip.itinerary &&
                                    trip.itinerary.length > 0
                                  ) {
                                    return `${trip.itinerary.length}日間`;
                                  } else {
                                    return "期間未設定";
                                  }
                                })()}
                              </span>
                              <span className="text-purple-600 font-semibold">
                                {trip.hero?.budget || "予算未設定"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {(trip.hero?.highlights || [])
                                .slice(0, 2)
                                .map((highlight, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                                  >
                                    {highlight}
                                  </span>
                                ))}
                              {(trip.hero?.highlights || []).length > 2 && (
                                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                  +{(trip.hero?.highlights || []).length - 2}
                                </span>
                              )}
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                📍 {trip.hero?.destination || "目的地未設定"}
                              </span>
                            </div>

                            <div className="mt-3 text-xs text-gray-500">
                              作成日:{" "}
                              {(() => {
                                if (!trip.created_at) return "不明";
                                try {
                                  // Firestoreのタイムスタンプの場合
                                  if (
                                    trip.created_at.toDate &&
                                    typeof trip.created_at.toDate === "function"
                                  ) {
                                    return new Date(
                                      trip.created_at.toDate()
                                    ).toLocaleDateString("ja-JP");
                                  }
                                  // 通常のDateオブジェクトまたは文字列の場合
                                  return new Date(
                                    trip.created_at
                                  ).toLocaleDateString("ja-JP");
                                } catch (error) {
                                  console.error("日付変換エラー:", error);
                                  return "不明";
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🗺️</div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        まだ旅行プランがありません
                      </h4>
                      <p className="text-gray-600 mb-6">
                        新しい旅行プランを作成して、素敵な旅を始めましょう！
                      </p>
                      <button
                        onClick={() => router.push("/")}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        旅行プランを作成する
                      </button>
                    </div>
                  )}
                </div>

                {/* Modal for Plan Details */}
                {showPlanModal &&
                  selectedHistoryPlan !== null &&
                  travelHistory[selectedHistoryPlan] && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="relative h-48 bg-gradient-to-br from-blue-600 to-indigo-700">
                          <img
                            src={
                              heroImages[
                                travelHistory[selectedHistoryPlan].trip_id
                              ]?.photo_url ||
                              travelHistory[selectedHistoryPlan].hero
                                ?.hero_image ||
                              "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=400&fit=crop"
                            }
                            alt={travelHistory[selectedHistoryPlan].hero?.title}
                            className="w-full h-full object-cover opacity-30"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white">
                              <h2 className="text-3xl font-bold mb-2">
                                {travelHistory[selectedHistoryPlan].hero?.title}
                              </h2>
                              <p className="text-lg opacity-90">
                                {
                                  travelHistory[selectedHistoryPlan].hero
                                    ?.subtitle
                                }
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                          <div className="absolute top-4 left-4">
                            {travelHistory[selectedHistoryPlan]
                              .firestore_id && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/plans/${travelHistory[selectedHistoryPlan].firestore_id}`
                                  )
                                }
                                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                              >
                                共有ページで見る
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Modal Content */}
                        <div className="overflow-y-auto max-h-[calc(90vh-12rem)] p-6">
                          {/* Highlights */}
                          <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                              このプランのハイライト
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(
                                travelHistory[selectedHistoryPlan].hero
                                  ?.highlights || []
                              ).map((highlight, index) => (
                                <div
                                  key={index}
                                  className="bg-blue-50 p-3 rounded-lg"
                                >
                                  <p className="text-blue-900 font-medium text-sm">
                                    {highlight}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Itinerary */}
                          <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                              詳細なスケジュール
                            </h3>
                            <div className="space-y-4">
                              {(
                                travelHistory[selectedHistoryPlan].itinerary ||
                                []
                              ).map((day, dayIndex) => (
                                <div
                                  key={dayIndex}
                                  className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                  <button
                                    onClick={() =>
                                      setExpandedDay(
                                        expandedDay === dayIndex
                                          ? null
                                          : dayIndex
                                      )
                                    }
                                    className="w-full bg-gray-50 p-4 text-left hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="text-lg font-bold text-gray-900">
                                          Day {day.day}:{" "}
                                          {day.city?.name || "都市名未設定"}
                                        </h4>
                                        <p className="text-gray-600 text-sm mt-1">
                                          {day.city?.description || ""}
                                        </p>
                                      </div>
                                      <svg
                                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                                          expandedDay === dayIndex
                                            ? "rotate-180"
                                            : ""
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    </div>
                                  </button>

                                  {expandedDay === dayIndex && (
                                    <div className="p-4 bg-white border-t border-gray-200">
                                      <div className="space-y-3">
                                        {(day.activities || []).map(
                                          (activity, actIndex) => (
                                            <div
                                              key={actIndex}
                                              className="flex space-x-3 p-3 bg-gray-50 rounded-lg"
                                            >
                                              <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                  <span className="text-blue-600 font-bold text-xs text-center">
                                                    {activity.time}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="flex-grow">
                                                <h5 className="font-bold text-gray-900 text-sm">
                                                  {activity.title}
                                                </h5>
                                                <p className="text-gray-600 text-xs mb-1">
                                                  {activity.subtitle}
                                                </p>
                                                <p className="text-gray-700 text-sm">
                                                  {activity.description}
                                                </p>
                                                <div className="flex space-x-3 mt-1 text-xs text-gray-500">
                                                  <span>
                                                    📍 {activity.location}
                                                  </span>
                                                  <span>
                                                    💰 {activity.price}
                                                  </span>
                                                  <span>
                                                    ⭐ {activity.rating}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>

                                      {/* Day Map */}
                                      {/* {routeData[`day_${day.day}_${travelHistory[selectedHistoryPlan].trip_id}`] && (
                                      <div className="mt-4">
                                        <h5 className="font-bold text-gray-900 mb-2 text-sm">この日のルート</h5>
                                        <div className="h-48 bg-gray-100 rounded-lg overflow-hidden">
                                          <InteractiveMap
                                            routeData={routeData[`day_${day.day}_${travelHistory[selectedHistoryPlan].trip_id}`]}
                                            activities={day.activities || []}
                                            locationData={locationData}
                                          />
                                        </div>
                                      </div>
                                    )} */}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Preferences Tab */}
          </div>
        </div>
      </div>
    </div>
  );
}
