export function getMockSchedule() {
  return {
    "trip_id": "shirakawa_takayama_2024",
    "theme": "wabi_sabi",
    "hero": {
      "title": "白川郷",
      "subtitle": "合掌造りが織りなす静寂の風景",
      "destination": "岐阜県",
      "duration": "2日間",
      "budget": "¥30,000 - ¥50,000",
      "hero_image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&h=900&fit=crop",
      "key_visual": {
        "main_image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&h=900&fit=crop",
        "alt_images": [
          "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1600&h=900&fit=crop",
          "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1600&h=900&fit=crop"
        ],
        "mood": "serene_traditional"
      },
      "highlights": [
        "合掌造りの世界遺産",
        "本場の飛騨牛グルメ", 
        "江戸時代の街並み散策"
      ]
    },
    "itinerary": [
      {
        "day": 1,
        "date": "2025-10-15",
        "city": {
          "name": "飛騨高山",
          "name_en": "Hida-Takayama",
          "description": "江戸時代の面影を残す古い町並み",
          "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop"
        },
        "activities": [
          {
            "id": "takayama_jinya",
            "time": "10:00 - 12:00",
            "title": "高山陣屋",
            "subtitle": "江戸時代の歴史を体感",
            "type": "heritage",
            "priority": "must_see",
            "image": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&h=400&fit=crop",
            "description": "江戸時代から明治初期まで郡代・代官が政務を行った役所。現存する唯一の代官所として国史跡に指定されています。",
            "location": "高山陣屋",
            "price": "¥440",
            "rating": 4.6,
            "tips": "朝一番の訪問がおすすめ。混雑を避けて静かに見学できます。"
          },
          {
            "id": "hida_beef_lunch", 
            "time": "12:30 - 13:30",
            "title": "飛騨牛にぎり寿司",
            "subtitle": "古い町並みで味わう極上グルメ",
            "type": "culinary",
            "priority": "recommended",
            "image": "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=400&fit=crop",
            "description": "A5ランクの飛騨牛を使った贅沢なにぎり寿司。口の中でとろける極上の味わい。",
            "location": "古い町並み",
            "price": "¥2,000",
            "rating": 4.8,
            "tips": "平日限定メニューもあるので事前確認を。"
          },
          {
            "id": "old_town_walk",
            "time": "14:00 - 16:00", 
            "title": "古い町並み散策",
            "subtitle": "タイムスリップした江戸の街道",
            "type": "experience",
            "priority": "must_do",
            "image": "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=600&h=400&fit=crop",
            "description": "江戸時代の商家建築が軒を連ねる、まさに生きた博物館。酒蔵、味噌屋、雑貨店など、昔ながらの商いが今も続いています。",
            "location": "上三之町・上二之町・上一之町",
            "price": "無料",
            "rating": 4.7,
            "tips": "夕方の斜光が美しい写真を撮影できるベストタイム。"
          }
        ]
      },
      {
        "day": 2,
        "date": "2025-10-16", 
        "city": {
          "name": "白川郷",
          "name_en": "Shirakawa-go",
          "description": "世界遺産の合掌造り集落",
          "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop"
        },
        "activities": [
          {
            "id": "gassho_village",
            "time": "09:00 - 10:30",
            "title": "合掌造り集落散策", 
            "subtitle": "世界遺産の絶景を歩く",
            "type": "scenic",
            "priority": "must_see",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
            "description": "1995年にユネスコ世界遺産に登録された美しい合掌造りの集落。四季折々の自然と調和した、日本の原風景が広がります。",
            "location": "白川郷 荻町集落",
            "price": "無料",
            "rating": 4.9,
            "tips": "朝霧に包まれる早朝の景色は特に幻想的です。"
          }
        ]
      }
    ]
  };
}

export function getMockPlans() {
  return [
    getMockSchedule(),
    {
      "trip_id": "tokyo_modern_2024",
      "theme": "urban_modern",
      "hero": {
        "title": "東京モダン",
        "subtitle": "伝統と未来が交差する都市体験",
        "destination": "東京都",
        "duration": "2日間",
        "budget": "¥40,000 - ¥60,000",
        "hero_image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&h=900&fit=crop",
        "key_visual": {
          "main_image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&h=900&fit=crop",
          "alt_images": [
            "https://images.unsplash.com/photo-1519639281642-5f4d6c15e6d2?w=1600&h=900&fit=crop"
          ],
          "mood": "urban_futuristic"
        },
        "highlights": [
          "東京スカイツリーからの絶景",
          "築地場外市場グルメ体験",
          "最新テクノロジー展示"
        ]
      },
      "itinerary": [
        {
          "day": 1,
          "date": "2025-11-01",
          "city": {
            "name": "浅草・押上",
            "name_en": "Asakusa-Oshiage",
            "description": "伝統と現代が共存するエリア",
            "image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=400&fit=crop"
          },
          "activities": [
            {
              "id": "skytree_visit",
              "time": "10:00 - 12:00",
              "title": "東京スカイツリー",
              "subtitle": "世界一の電波塔から見渡す東京",
              "type": "scenic",
              "priority": "must_see",
              "image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop",
              "description": "高さ634mの世界一高い電波塔。天望デッキからは関東平野を一望できます。",
              "location": "東京スカイツリータウン",
              "price": "¥2,100",
              "rating": 4.5,
              "tips": "平日の朝一番が比較的空いています。"
            }
          ]
        }
      ]
    },
    {
      "trip_id": "kyoto_zen_2024", 
      "theme": "traditional_zen",
      "hero": {
        "title": "京都禅体験",
        "subtitle": "千年の古都で心を整える旅",
        "destination": "京都府",
        "duration": "2日間",
        "budget": "¥35,000 - ¥55,000",
        "hero_image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&h=900&fit=crop",
        "key_visual": {
          "main_image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&h=900&fit=crop",
          "alt_images": [
            "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&h=900&fit=crop"
          ],
          "mood": "zen_traditional"
        },
        "highlights": [
          "金閣寺の黄金に輝く美",
          "嵐山竹林の小径散策",
          "精進料理で禅の心を学ぶ"
        ]
      },
      "itinerary": [
        {
          "day": 1,
          "date": "2025-12-01",
          "city": {
            "name": "北山・嵐山",
            "name_en": "Kitayama-Arashiyama", 
            "description": "京都の代表的な観光エリア",
            "image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=400&fit=crop"
          },
          "activities": [
            {
              "id": "kinkaku_temple",
              "time": "09:00 - 10:30",
              "title": "金閣寺（鹿苑寺）",
              "subtitle": "黄金に輝く室町時代の名建築",
              "type": "heritage",
              "priority": "must_see",
              "image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop",
              "description": "足利義満が建立した黄金の三層楼閣。四季折々の美しさで世界中の人々を魅了します。",
              "location": "金閣寺",
              "price": "¥400",
              "rating": 4.8,
              "tips": "朝一番の拝観がおすすめ。鏡湖池に映る金閣が美しく撮影できます。"
            }
          ]
        }
      ]
    }
  ];
}