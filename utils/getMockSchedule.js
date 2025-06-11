// utils/getMockSchedule.js

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
      // key_visualを追加
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
