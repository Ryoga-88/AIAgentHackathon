export interface KeyVisual {
  main_image: string;
  alt_images: string[];
  mood: string;
}

export interface HeroData {
  title: string;
  subtitle: string;
  destination: string;
  duration: string;
  budget: string;
  hero_image: string;
  key_visual?: KeyVisual;
  highlights: string[];
}

export interface City {
  name: string;
  name_en: string;
  description: string;
  image: string;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  type: 'heritage' | 'culinary' | 'experience' | 'scenic' | 'cultural' | 'art' | 'nature' | 'wellness' | 'adventure' | 'beach';
  priority: 'must_see' | 'must_do' | 'recommended' | 'optional';
  image: string;
  description: string;
  location: string;
  price: string;
  rating: number;
  tips?: string;
}

export interface DaySchedule {
  day: number;
  date: string;
  city: City;
  activities: Activity[];
}

export interface TravelSchedule {
  trip_id: string;
  theme: string;
  hero: HeroData;
  itinerary: DaySchedule[];
}