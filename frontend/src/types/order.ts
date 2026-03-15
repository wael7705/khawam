/**
 * أنواع الطلبات للقائمة، التفاصيل، وبيانات إعادة الطلب.
 */

export interface OrderListItem {
  id: string;
  order_number: string;
  service_id?: string;
  service_name_ar?: string;
  service_name_en?: string;
  customer_name?: string;
  customer_phone?: string;
  status: string;
  final_amount: number;
  created_at: string;
  items?: Array<{ product_name: string; quantity: number }>;
}

export interface OrderItemDetail {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  specifications?: Record<string, unknown>;
  design_files?: string[] | Array<{ url: string }>;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  service_id?: string;
  service_name_ar?: string;
  service_name_en?: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  shop_name?: string;
  status: string;
  final_amount: number;
  notes?: string;
  delivery_type?: string;
  delivery_address?: string;
  delivery_street?: string;
  delivery_neighborhood?: string;
  delivery_building_floor?: string;
  delivery_extra?: string;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  files?: string[];
  specifications?: Record<string, unknown>;
  items: OrderItemDetail[];
}

/** بيانات إعادة الطلب من GET /api/orders/:orderId/reorder-data */
export interface ReorderData {
  service_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_whatsapp?: string;
  shop_name?: string;
  delivery_type?: string;
  delivery_address?: string;
  delivery_street?: string;
  delivery_neighborhood?: string;
  delivery_building_floor?: string;
  delivery_extra?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  notes?: string;
  files?: string[];
  items: Array<{
    product_name?: string;
    product_id?: string;
    quantity: number;
    unit_price?: number;
    specifications?: Record<string, unknown>;
    design_files?: string[];
  }>;
  total_amount?: number;
  final_amount?: number;
}
