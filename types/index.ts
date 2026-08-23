export type Category =
  | "physical_resale"
  | "handmade_creative"
  | "services"
  | "digital";

export type Condition = "new" | "like_new" | "good" | "fair" | "poor";

export type ListingStatus = "active" | "sold" | "deleted";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_anonymous: boolean;
  pseudonym_id: string;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  category: Category;
  condition: Condition | null;
  payment_method: string;
  images: string[];
  is_anonymous: boolean;
  is_sample: boolean;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  seller?: Profile;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
  listing?: Listing;
  buyer?: Profile;
  seller?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  listing_id: string;
  reviewer_id: string;
  seller_id: string;
  rating: number;
  content: string;
  created_at: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  physical_resale: "Physical Resale",
  handmade_creative: "Handmade & Creative",
  services: "Services",
  digital: "Digital",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  physical_resale: "📦",
  handmade_creative: "🎨",
  services: "🔧",
  digital: "💻",
};
