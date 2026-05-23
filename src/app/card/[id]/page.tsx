'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCard, saveCard, deleteCard, BusinessCard } from '@/lib/storage';
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, Trash2, Edit2, Check } from 'lucide-react';

export default function CardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<BusinessCard>>({});

  useEffect(() => {
    if (params.id) {
      getCard(params.id as string).then(c => {
        if (c) { setCard(c); setEditData(c); }
      });
    }
  }, [params.id]);

  const handleSave = async () => {
    if (!card) return;
    const updated = { ...card, ...editData };
    await saveCard(updated);
    setCard(updated);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!card || !confirm('この名刺を削除しますか？')) return;
    await deleteCard(card.id);
    router.push('/');
  };

  if (!card) return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const fields = [
    { label: '会社名', key: 'companyName', icon: Building2, color: 'text-indigo-400' },
    { label: '氏名', key: 'fullName', icon: User, color: 'text-white' },
    { label: '携帯電話', key: 'phoneNumber', icon: Phone, color: 'text-green-400' },
    { label: 'メール', key: 'email', icon: Mail, color: 'text-blue-400' },
    { label: '住所', key: 'address', icon: MapPin, color: 'text-orange-400' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a2e] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()}>
            <ArrowLeft size={24} className="text-white" />
          </button>
          <span className="text-white font-medium">名刺詳細</span>
          <div className="flex gap-2">
            {isEditing ? (
              <button onClick={handleSave} className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
                <Check size={18} className="text-white" />
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center">
                <Edit2 size={16} className="text-white" />
              </button>
            )}
            <button onClick={handleDelete} className="w-9 h-9 bg-red-500/20 rounded-full flex items-center justify-center">
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Card image */}
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden bg-[#1a1a2e] border border-gray-700">
          {card.imageData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageData} alt="名刺" className="w-full object-contain max-h-56" />
          ) : (
            <div className="h-40 flex items-center justify-center">
              <span className="text-gray-600 text-5xl">📇</span>
            </div>
          )}
          <div className="px-4 py-2 flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${
              card.source === 'import' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
            }`}>
              {card.source === 'import' ? 'インポート' : 'スキャン'}
            </span>
            <span className="text-gray-500 text-xs">
              {new Date(card.createdAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="px-4 mt-4 space-y-3 pb-8">
          {fields.map(({ label, key, icon: Icon, color }) => (
            <div key={key} className="bg-[#1a1a2e] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={color} />
                <span className="text-gray-400 text-xs font-medium">{label}</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={(editData as unknown as Record<string, string>)[key] || ''}
                  onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full bg-[#0f0f1a] text-white px-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500"
                  placeholder={`${label}を入力`}
                />
              ) : (
                <p className={`text-base font-medium ${(card as unknown as Record<string, string>)[key] ? color : 'text-gray-600'}`}>
                  {(card as unknown as Record<string, string>)[key] || '未取得'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
