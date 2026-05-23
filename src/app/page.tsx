'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllCards, BusinessCard } from '@/lib/storage';
import CardListItem from '@/components/CardListItem';
import { Camera, Upload, CreditCard, Search } from 'lucide-react';

export default function HomePage() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCards().then(c => {
      setCards(c);
      setLoading(false);
    });
  }, []);

  const filtered = cards.filter(c =>
    !search ||
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumber.includes(search)
  );

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a2e] px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-2xl font-bold">名刺管理</h1>
            <p className="text-gray-400 text-sm">{cards.length}枚の名刺</p>
          </div>
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
            <CreditCard size={20} className="text-white" />
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="会社名・氏名・電話番号で検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0f0f1a] text-white pl-9 pr-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Card List */}
      <div className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 bg-[#1a1a2e] rounded-3xl flex items-center justify-center mb-4">
              <CreditCard size={40} className="text-indigo-500" />
            </div>
            <p className="text-white text-lg font-medium mb-2">
              {search ? '該当する名刺がありません' : 'まだ名刺がありません'}
            </p>
            <p className="text-gray-500 text-sm">
              {search ? '別のキーワードで検索してください' : 'スキャンまたはインポートで名刺を追加してください'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(card => (
              <CardListItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-gray-800 px-4 pb-6 pt-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-1">
            <CreditCard size={24} className="text-indigo-500" />
            <span className="text-indigo-500 text-xs font-medium">ホーム</span>
          </button>
          <Link href="/scan" className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-lg shadow-indigo-500/30">
              <Camera size={28} className="text-white" />
            </div>
            <span className="text-gray-400 text-xs">スキャン</span>
          </Link>
          <Link href="/import" className="flex flex-col items-center gap-1">
            <Upload size={24} className="text-gray-400" />
            <span className="text-gray-400 text-xs">インポート</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
