import Link from 'next/link';
import { BusinessCard } from '@/lib/storage';
import { Building2, User, Phone } from 'lucide-react';

export default function CardListItem({ card }: { card: BusinessCard }) {
  return (
    <Link href={`/card/${card.id}`}>
      <div className="bg-[#1a1a2e] rounded-2xl p-4 flex gap-4 items-center active:scale-95 transition-transform">
        {/* Card thumbnail */}
        <div className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
          {card.imageData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imageData}
              alt="名刺"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500 text-2xl">📇</span>
            </div>
          )}
        </div>

        {/* Card info */}
        <div className="flex-1 min-w-0">
          {card.companyName && (
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 size={12} className="text-indigo-400 flex-shrink-0" />
              <p className="text-indigo-300 text-xs font-medium truncate">{card.companyName}</p>
            </div>
          )}
          {card.fullName && (
            <div className="flex items-center gap-1.5 mb-1">
              <User size={12} className="text-gray-400 flex-shrink-0" />
              <p className="text-white font-bold text-base truncate">{card.fullName}</p>
            </div>
          )}
          {card.phoneNumber && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} className="text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm truncate">{card.phoneNumber}</p>
            </div>
          )}
          {!card.companyName && !card.fullName && !card.phoneNumber && (
            <p className="text-gray-500 text-sm">情報を取得できませんでした</p>
          )}
        </div>

        {/* Source badge */}
        <div className="flex-shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full ${
            card.source === 'import' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {card.source === 'import' ? 'インポート' : 'スキャン'}
          </span>
        </div>
      </div>
    </Link>
  );
}
