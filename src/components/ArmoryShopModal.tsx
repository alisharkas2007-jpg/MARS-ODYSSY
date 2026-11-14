import React, { useState } from 'react';
import { Check, Coins, Cpu, Heart, Package, Palette, Shield, Sparkles, X } from 'lucide-react';
import { ABILITY_CATALOG, CONSUMABLE_CATALOG, PET_CATALOG, SUIT_CATALOG } from '../data/catalog';
import { TranslationDict } from '../i18n/translations';
import { AbilityId, ConsumableId, GameProgress, Language, PetId, SuitId } from '../types/game';

interface ArmoryShopModalProps {
  t: TranslationDict;
  language: Language;
  progress: GameProgress;
  onClose: () => void;
  onBuyOrEquipSuit: (id: SuitId) => void;
  onBuyAbility: (id: AbilityId) => void;
  onBuyConsumable: (id: ConsumableId) => void;
  onUseConsumable: (id: ConsumableId) => void;
  onBuyOrEquipPet: (id: PetId) => void;
}

type ShopTab = 'suits' | 'abilities' | 'consumables' | 'pets';

export const ArmoryShopModal: React.FC<ArmoryShopModalProps> = ({
  t,
  language,
  progress,
  onClose,
  onBuyOrEquipSuit,
  onBuyAbility,
  onBuyConsumable,
  onUseConsumable,
  onBuyOrEquipPet,
}) => {
  const [tab, setTab] = useState<ShopTab>('suits');

  const tabs: Array<{ id: ShopTab; label: string; icon: React.ReactNode }> = [
    { id: 'suits', label: t.shop.tabs.suits, icon: <Palette className="w-4 h-4" /> },
    { id: 'abilities', label: t.shop.tabs.abilities, icon: <Cpu className="w-4 h-4" /> },
    { id: 'consumables', label: t.shop.tabs.consumables, icon: <Package className="w-4 h-4" /> },
    { id: 'pets', label: t.shop.tabs.pets, icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#1b124d] border-2 border-yellow-400/50 p-5 sm:p-7 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-yellow-300">
              {t.shop.title}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">{t.shop.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-[#2a1d6e] border border-yellow-400/40 px-3.5 py-2 font-display text-base font-bold text-yellow-300 tabular-nums">
              <Coins className="w-4 h-4" />
              <span>{progress.credits}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="btn-chunky-sm rounded-xl bg-[#2c1f70] border-indigo-950 p-2 text-indigo-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`btn-chunky-sm flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 font-display text-sm font-bold cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-cyan-400 border-cyan-700 text-slate-950'
                    : 'bg-[#261a63] border-indigo-950 text-indigo-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-scroll pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {tab === 'suits' &&
            SUIT_CATALOG.map((suit) => {
              const owned = progress.ownedSuits.includes(suit.id);
              const equipped = progress.equippedSuit === suit.id;
              const canAfford = progress.credits >= suit.cost;
              return (
                <div
                  key={suit.id}
                  className={`rounded-2xl p-4 border-2 flex flex-col justify-between gap-3 ${
                    equipped ? 'bg-[#281b6e] border-emerald-400' : 'bg-[#211559] border-indigo-400/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Live Suit Swatch */}
                    <div
                      className="w-14 h-14 rounded-2xl border-2 border-white/30 shrink-0 flex flex-col items-center justify-center shadow-inner"
                      style={{ backgroundColor: suit.primaryHex }}
                    >
                      <div
                        className="w-8 h-4 rounded-md border border-slate-900/40"
                        style={{ backgroundColor: suit.visorHex }}
                      />
                      <div
                        className="w-9 h-2 rounded-full mt-1.5"
                        style={{ backgroundColor: suit.accentHex }}
                      />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {language === 'ar' ? suit.nameAr : suit.nameEn}
                      </h3>
                      <p className="text-xs text-indigo-200 leading-relaxed mt-0.5">
                        {language === 'ar' ? suit.descAr : suit.descEn}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="font-display text-sm font-bold text-yellow-300 tabular-nums">
                      {suit.cost === 0 ? t.shop.free : `${suit.cost} CR`}
                    </span>
                    <button
                      onClick={() => onBuyOrEquipSuit(suit.id)}
                      disabled={!owned && !canAfford}
                      className={`btn-chunky-sm rounded-xl px-4 py-2 font-display text-xs font-bold cursor-pointer whitespace-nowrap ${
                        equipped
                          ? 'bg-emerald-400 border-emerald-700 text-slate-950'
                          : owned
                            ? 'bg-cyan-400 border-cyan-700 text-slate-950'
                            : canAfford
                              ? 'bg-yellow-400 border-amber-600 text-slate-950'
                              : 'bg-slate-700 border-slate-900 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? t.shop.equipped : owned ? t.shop.equip : canAfford ? t.shop.buy : t.shop.needCredits}
                    </button>
                  </div>
                </div>
              );
            })}

          {tab === 'abilities' &&
            ABILITY_CATALOG.map((ab) => {
              const owned = progress.ownedAbilities.includes(ab.id);
              const canAfford = progress.credits >= ab.cost;
              return (
                <div
                  key={ab.id}
                  className={`rounded-2xl p-4 border-2 flex flex-col justify-between gap-3 ${
                    owned ? 'bg-[#281b6e] border-emerald-400' : 'bg-[#211559] border-indigo-400/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-slate-950"
                      style={{ backgroundColor: ab.badgeColor }}
                    >
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {language === 'ar' ? ab.nameAr : ab.nameEn}
                      </h3>
                      <p className="text-xs text-indigo-200 leading-relaxed mt-0.5">
                        {language === 'ar' ? ab.descAr : ab.descEn}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="font-display text-sm font-bold text-yellow-300 tabular-nums">
                      {ab.cost} CR
                    </span>
                    <button
                      onClick={() => onBuyAbility(ab.id)}
                      disabled={owned || !canAfford}
                      className={`btn-chunky-sm inline-flex items-center gap-1 rounded-xl px-4 py-2 font-display text-xs font-bold cursor-pointer whitespace-nowrap ${
                        owned
                          ? 'bg-emerald-400 border-emerald-700 text-slate-950'
                          : canAfford
                            ? 'bg-yellow-400 border-amber-600 text-slate-950'
                            : 'bg-slate-700 border-slate-900 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {owned && <Check className="w-3.5 h-3.5" />}
                      <span>{owned ? t.shop.owned : canAfford ? t.shop.buy : t.shop.needCredits}</span>
                    </button>
                  </div>
                </div>
              );
            })}

          {tab === 'consumables' &&
            CONSUMABLE_CATALOG.map((con) => {
              const count = progress.consumables[con.id] || 0;
              const canAfford = progress.credits >= con.cost;
              return (
                <div
                  key={con.id}
                  className="rounded-2xl p-4 border-2 bg-[#211559] border-indigo-400/30 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center font-display text-lg font-bold text-slate-950"
                      style={{ backgroundColor: con.accentColor }}
                    >
                      {con.hotkey}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {language === 'ar' ? con.nameAr : con.nameEn}
                      </h3>
                      <p className="text-xs text-indigo-200 leading-relaxed mt-0.5">
                        {language === 'ar' ? con.descAr : con.descEn}
                      </p>
                      <div className="mt-1.5 text-xs font-bold text-cyan-300 tabular-nums">
                        {t.shop.inBag}: {count} · {t.shop.useHotkey}: {con.hotkey}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <span className="font-display text-sm font-bold text-yellow-300 tabular-nums">
                      {con.cost} CR
                    </span>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <button
                          onClick={() => onUseConsumable(con.id)}
                          className="btn-chunky-sm rounded-xl bg-emerald-400 border-emerald-700 px-3 py-2 font-display text-xs font-bold text-slate-950 cursor-pointer"
                        >
                          Use
                        </button>
                      )}
                      <button
                        onClick={() => onBuyConsumable(con.id)}
                        disabled={!canAfford}
                        className={`btn-chunky-sm rounded-xl px-4 py-2 font-display text-xs font-bold cursor-pointer whitespace-nowrap ${
                          canAfford
                            ? 'bg-yellow-400 border-amber-600 text-slate-950'
                            : 'bg-slate-700 border-slate-900 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? t.shop.buy : t.shop.needCredits}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          {tab === 'pets' &&
            PET_CATALOG.map((pet) => {
              const owned = progress.ownedPets.includes(pet.id);
              const equipped = progress.equippedPet === pet.id;
              const canAfford = progress.credits >= pet.cost;
              return (
                <div
                  key={pet.id}
                  className={`rounded-2xl p-4 border-2 flex flex-col justify-between gap-3 ${
                    equipped ? 'bg-[#281b6e] border-emerald-400' : 'bg-[#211559] border-indigo-400/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl border-2 border-white/30 shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: pet.primaryHex }}
                    >
                      <Sparkles className="w-6 h-6 text-slate-950" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {language === 'ar' ? pet.nameAr : pet.nameEn}
                      </h3>
                      <p className="text-xs text-indigo-200 leading-relaxed mt-0.5">
                        {language === 'ar' ? pet.descAr : pet.descEn}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="font-display text-sm font-bold text-yellow-300 tabular-nums">
                      {pet.cost === 0 ? t.shop.free : `${pet.cost} CR`}
                    </span>
                    <button
                      onClick={() => onBuyOrEquipPet(pet.id)}
                      disabled={!owned && !canAfford}
                      className={`btn-chunky-sm rounded-xl px-4 py-2 font-display text-xs font-bold cursor-pointer whitespace-nowrap ${
                        equipped
                          ? 'bg-emerald-400 border-emerald-700 text-slate-950'
                          : owned
                            ? 'bg-cyan-400 border-cyan-700 text-slate-950'
                            : canAfford
                              ? 'bg-yellow-400 border-amber-600 text-slate-950'
                              : 'bg-slate-700 border-slate-900 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? t.shop.equipped : owned ? t.shop.equip : canAfford ? t.shop.buy : t.shop.needCredits}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
