import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../apiService';
import { ArrowLeft, Package, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderItem {
  product_id: string;
  name: string;
  productName?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  unit: string;
}

interface Order {
  id: string;
  customerName: string;
  customer_id: number;
  status: string;
  amount: number;
  grand_total: number;
  order_date: string;
  items: OrderItem[];
  shipping_address?: string;
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const justOrdered = location.state?.justOrdered;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await apiService.getOrder(id!);
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Dispatched': return 'bg-blue-100 text-blue-700';
      case 'Approved': return 'bg-purple-100 text-purple-700';
      case 'Created': return 'bg-amber-100 text-amber-700';
      case 'Invoiced': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-5 text-center py-12">
        <p className="text-slate-600">Order not found</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/orders')} 
          className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{order.id}</h1>
          <p className="text-sm text-slate-500">{order.customerName}</p>
        </div>
      </div>

      {/* Success Message */}
      {justOrdered && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3"
        >
          <CheckCircle className="w-6 h-6 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Order Created Successfully!</p>
            <p className="text-xs text-emerald-700">Order has been submitted for processing</p>
          </div>
        </motion.div>
      )}

      {/* Status */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Status</span>
          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-slate-600">Order Date</span>
          <span className="text-sm font-semibold text-slate-800">
            {new Date(order.order_date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Items */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Items ({order.items.length})</h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {order.items.map((item, idx) => (
            <div 
              key={item.product_id} 
              className={`p-4 flex items-center gap-3 ${idx !== order.items.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{item.name || item.productName}</p>
                <p className="text-xs text-slate-500">
                  {item.quantity} × ₹{(item.price || item.unitPrice)?.toLocaleString()}
                </p>
              </div>
              <span className="text-sm font-bold text-slate-900">
                ₹{((item.price || item.unitPrice || 0) * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">Total</span>
          <span className="text-2xl font-extrabold text-slate-900">
            ₹{(order.grand_total || order.amount).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
