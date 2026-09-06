import React, { useState } from 'react';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';
import { KeywordRule } from '../hooks/useKeywordRules';
import { PRESET_CATEGORY_ICONS, CATEGORY_COLORS, getColorDef } from './CategoryEditModal';
import { MiscIcon } from './icons/CategoryIcons';
import ConfirmationModal from './ConfirmationModal';

interface KeywordIconRulesTabProps {
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
}

export const KeywordIconRulesTab: React.FC<KeywordIconRulesTabProps> = ({ setToastInfo }) => {
  const { rules, addRule, deleteRule, updateRule, customIcons: rawCustomIcons } = useCategoryVisuals();
  
  // Filter out category assignments, keeping only pure custom icon assets so both lists are synchronized
  const customIcons = rawCustomIcons.filter(ci => !ci.id?.startsWith('mapping_'));

  const [keyword, setKeyword] = useState('');
  const [selectedIconId, setSelectedIconId] = useState('misc');
  const [selectedColor, setSelectedColor] = useState('bg-[#3b82f6]');
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Combine presets and custom icons
  const totalIcons = [
    ...PRESET_CATEGORY_ICONS,
    ...customIcons.map(ci => ({
      id: ci.id || ci.name,
      name: ci.name,
      label: ci.name.replace(/Icon$/, ''),
      icon: (props?: any) => {
        if (ci.type === 'svg' && ci.svgContent) {
          return (
            <div
              className={`w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 ${props?.className || ''}`}
              dangerouslySetInnerHTML={{ __html: ci.svgContent }}
            />
          );
        }
        if (ci.imageUrl) {
          return <img src={ci.imageUrl} className={`w-5 h-5 object-contain ${props?.className || ''}`} alt={ci.name} />;
        }
        return <span className={`text-sm ${props?.className || ''}`}>✨</span>;
      }
    }))
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) {
      setToastInfo({ message: 'Veuillez saisir un mot-clé.', type: 'error' });
      return;
    }

    if (editingRuleId) {
      const success = updateRule(editingRuleId, trimmed, selectedIconId, selectedColor);
      if (success) {
        setToastInfo({ message: `Règle mise à jour pour « ${trimmed} ».`, type: 'info' });
        setKeyword('');
        setSelectedIconId('misc');
        setSelectedColor('bg-[#3b82f6]');
        setEditingRuleId(null);
      }
    } else {
      const success = addRule(trimmed, selectedIconId, selectedColor);
      if (success) {
        setToastInfo({ message: `Règle ajoutée pour « ${trimmed} ».`, type: 'info' });
        setKeyword('');
        setSelectedIconId('misc');
        setSelectedColor('bg-[#3b82f6]');
      }
    }
  };

  const handleEdit = (rule: KeywordRule) => {
    setEditingRuleId(rule.id);
    setKeyword(rule.keyword);
    setSelectedIconId(rule.iconId);
    setSelectedColor(rule.color);
    
    // Smooth scroll to top of page/form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setKeyword('');
    setSelectedIconId('misc');
    setSelectedColor('bg-[#3b82f6]');
  };

  const handleDeleteConfirm = () => {
    if (deletingRuleId) {
      deleteRule(deletingRuleId);
      setToastInfo({ message: 'Règle supprimée avec succès.', type: 'info' });
      setDeletingRuleId(null);
      if (editingRuleId === deletingRuleId) {
        handleCancelEdit();
      }
    }
  };

  const getIconComponent = (iconId: string) => {
    const found = totalIcons.find(t => t.id === iconId || t.name === iconId);
    return found ? found.icon : MiscIcon;
  };

  const colorDef = getColorDef(selectedColor);
  const IconPreviewComponent = getIconComponent(selectedIconId);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-xl mx-auto">
      {/* Header Info */}
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Mots-clés & Icônes
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Associez automatiquement une icône et une couleur aux dépenses dont la description contient un mot-clé précis (ex: « netflix », « carrefour »).
        </p>
      </div>

      {/* Add / Edit Rule Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
          <span>{editingRuleId ? '✏️' : '🎯'}</span> {editingRuleId ? 'Modifier la règle de mot-clé' : 'Ajouter une nouvelle règle'}
        </h3>

        <form onSubmit={handleAdd} className="space-y-5">
          {/* Keyword Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mot-clé détecté
            </label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Ex: netflix, total, anniversaire, boulangerie..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/95 dark:border-slate-600 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Icon Selector Scrollable list */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Associer l'icône
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-1 px-1">
              {totalIcons.map(item => {
                const isSelected = selectedIconId === item.id;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIconId(item.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all shrink-0 w-16 snap-start cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 scale-102 shadow-2xs font-bold'
                        : 'border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-500/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] truncate w-full text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector Grid */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Associer la couleur
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {CATEGORY_COLORS.map(color => {
                const isSelected = selectedColor === color.bgClass;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.bgClass)}
                    className={`w-8 h-8 rounded-full ${color.bgClass} flex items-center justify-center transition-all cursor-pointer relative shadow-2xs ${
                      isSelected ? 'ring-2 ring-offset-2 ring-blue-500 scale-108' : 'hover:scale-105'
                    }`}
                    title={color.label}
                  >
                    {isSelected && (
                      <svg className="w-4 h-4 text-white font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Aperçu en direct
            </label>
            <div className="bg-slate-50/70 dark:bg-slate-700/40 rounded-2xl p-3.5 border border-slate-100/90 dark:border-slate-700/60 flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${colorDef.badgeBgClass} ${colorDef.textColorClass} transition-colors shadow-2xs`}
              >
                <IconPreviewComponent className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug truncate">
                  {keyword.trim() || 'Mot-clé'}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                  Les dépenses contenant ce mot-clé adopteront ce visuel.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            {editingRuleId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-1/3 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-base transition-all active:scale-[0.99] cursor-pointer"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              className={`py-3.5 px-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer ${
                editingRuleId ? 'w-2/3 bg-amber-500 hover:bg-amber-600 active:bg-amber-750' : 'w-full bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8]'
              }`}
            >
              {editingRuleId ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Enregistrer les modifications</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Créer la règle de mot-clé</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Rules List */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg px-1 flex items-center justify-between">
          <span>📋 Règles actives</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            {rules.length} règle{rules.length > 1 ? 's' : ''}
          </span>
        </h3>

        {rules.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-700/60 flex flex-col items-center justify-center space-y-2">
            <span className="text-3xl">💡</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Aucune règle définie</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs text-center max-w-sm">
              Saisissez un mot-clé ci-dessus (comme « anniversaire ») pour lui associer automatiquement une icône et une couleur.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => {
              const IconComponent = getIconComponent(rule.iconId);
              const colorDef = getColorDef(rule.color);
              
              return (
                <div
                  key={rule.id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-2xs p-3.5 flex items-center justify-between gap-3 hover:shadow-xs transition-all ${
                    editingRuleId === rule.id ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400/30' : 'border-slate-100/90 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${colorDef.badgeBgClass} ${colorDef.textColorClass} transition-colors shadow-3xs`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">
                        {rule.keyword}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                        Si description contient « {rule.keyword} »
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(rule)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
                      title="Modifier la règle"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRuleId(rule.id)}
                      className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-red-100/80 dark:border-rose-900/40 flex items-center justify-center text-red-500 dark:text-rose-400 transition-all active:scale-95 cursor-pointer"
                      title="Supprimer la règle"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingRuleId}
        onClose={() => setDeletingRuleId(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la règle de mot-clé"
        message="Êtes-vous sûr de vouloir supprimer cette règle d'association ? Les dépenses existantes reprendront leur apparence standard si aucun autre mot-clé ne s'applique."
      />
    </div>
  );
};
