"""Importe les bonus d'équipe des attaquants et supports depuis le classeur « Formation ninja » (onglet database).

Usage : python3 tools/import_sheet.py <classeur.xlsx>  → écrit ninjas/sheet-auras.js
Chaque colonne chiffrée est un bonus pour tous les alliés ou un malus pour tous les ennemis ;
les lignes « <ninja> <nature> » sont des bonus pour les alliés de cette nature.
"""
import json, re, sys, unicodedata
import openpyxl

# colonne → (camp, stat, signe)
COLS = {
    'vitesse': ('ally', 'speed', 1), 'HP': ('ally', 'hp', 1), 'attaque': ('ally', 'atk', 1), 'réduc attaque': ('enemy', 'atk', -1),
    'taux de dégâts': ('ally', 'dr', 1), 'réduc taux de dégats': ('enemy', 'dr', -1), 'tour bonus': ('ally', 'punch', 1),
    'réduc tour bonus': ('enemy', 'punch', -1), 'absorption': ('ally', 'air', 1), 'réduc absorption': ('enemy', 'air', -1),
    'réduc CC': ('ally', 'ccRes', 1), 'augmentation CC': ('ally', 'ccRate', 1), 'défense PHY': ('ally', 'pdef', 1),
    'défense MAG': ('ally', 'mdef', 1), 'réduc défense PHY': ('enemy', 'pdef', -1), 'réduc défense MAG': ('enemy', 'mdef', -1),
    'réduc défense (PHY/MAG)': ('enemy', 'def', -1), 'augmente dégats finaux': ('ally', 'finalDmg', 1),
    'réduc dégats finaux': ('ally', 'finalReduction', 1), 'augmente CRIT': ('ally', 'crit', 1), 'réduc CRIT': ('enemy', 'crit', -1),
    'ignore DEF': ('ally', 'ignoreDef', 1), 'résistance ignore DEF': ('ally', 'immuneIgnoreDef', 1),
    'réduc résistance ignore DEF': ('enemy', 'immuneIgnoreDef', -1), 'augmentation ATK S': ('ally', 'sAtk', 1),
    'réduc attaque S': ('enemy', 'sAtk', -1), 'augmentation précision': ('ally', 'hit', 1), 'réduc précision': ('enemy', 'hit', -1),
    'augmente blocage': ('ally', 'block', 1), 'réduc blocage': ('enemy', 'block', -1),
    'augmente CC supports': ('allySupport', 'ccRate', 1), 'réduc CC supports': ('allySupport', 'ccRes', 1),
    'augmentation taux de soins': ('ally', 'recovery', 1), 'réduc taux de soins': ('enemy', 'recoveryCut', 1),
    'Réduc immunité CC': ('enemy', 'ccRes', -1), 'réduction chance de CC': ('enemy', 'ccRate', -1),
    'réduction vitesse': ('enemy', 'speed', -1), 'immunité de pénétration': ('ally', 'penMalus', 1),
    'bouclier de défense': ('ally', 'pdefShield', 1), 'dégâts de pénétration': ('ally', 'penBonus', 1),
    "réduction de l'aide": ('enemy', 'aid', -1), "augmentation de l'aide": ('ally', 'aid', 1),
    'bouclier DEF magique': ('ally', 'mdefShield', 1), 'résistance blocage S+': ('ally', 'sBlockRes', 1),
    'résistance réduction de DEF': ('ally', 'defCutRes', 1), 'Augmentation ignore défense': ('ally', 'ignoreDef', 1),
    "augmente l'aide": ('ally', 'aid', 1), "réduit l'aide": ('enemy', 'aid', -1),
}
IMMUNE = {
    'graine de mort': 'deathSeed', 'gel': 'freeze', 'wind bond': 'windBound', 'charme': 'charm', 'sceau': 'seal',
    'réduction de furie': 'furyReduction', "état d'affaiblissement": 'weakened', 'emprisonnement': 'imprison',
    'aveuglement': 'blind', 'chaos': 'chaos', 'statut désactivé': 'disable', 'vent empoisonné': 'poisonousWind',
    'accuponcture': 'acupoint', 'silence': 'silence', 'pétrification': 'petrify', 'shock': 'shock',
    'malédiction': 'curseFixation', 'Corrosion': 'corrosion', 'Acide collant': 'stickyAcid',
}
NATURE = {'eau': 'water', 'feu': 'fire', 'terre': 'earth', 'foudre': 'thunder', 'vent': 'wind'}
ROLE = {'attaquant': 'assaulter', 'support': 'supporter', 'avant-garde': 'vanguard'}

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def mods(row, hdr):
    by_side = {}
    for i, h in enumerate(hdr):
        if h in COLS and row[i] not in (None, ''):
            side, stat, sign = COLS[h]
            by_side.setdefault(side, {})
            by_side[side][stat] = by_side[side].get(stat, 0) + sign * float(row[i])
    return by_side

def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['database']
    hdr = [c.value for c in ws[1]]
    rows = [r for r in ws.iter_rows(min_row=2, values_only=True) if r[0]]
    cut = next(i for i, r in enumerate(rows) if r[0] == 'CHAKRA')
    base, natrows = rows[:cut], rows[cut + 1:]
    out = {}
    for r in base:
        role = ROLE.get(r[100])
        if role not in ('assaulter', 'supporter'):
            continue
        name = r[0].strip()
        entry = {'name': name, 'role': role, 'auras': mods(r, hdr), 'natures': {},
                 'immune': [IMMUNE[hdr[i]] for i in range(104, len(hdr)) if hdr[i] in IMMUNE and r[i] not in (None, '')]}
        for nr in natrows:
            nm = nr[0].strip()
            if nm.startswith(name + ' ') and nm[len(name) + 1:].strip() in NATURE:
                mm = mods(nr, hdr)
                entry['natures'][NATURE[nm[len(name) + 1:].strip()]] = mm.get('ally', {}) | \
                    {f'enemy:{k}': v for k, v in mm.get('enemy', {}).items()} | \
                    {f'support:{k}': v for k, v in mm.get('allySupport', {}).items()}
        out[slug(name)] = entry
    js = ('// Généré par tools/import_sheet.py depuis le classeur « Formation ninja » — ne pas modifier à la main.\n'
          f'export const SHEET = {json.dumps(out, ensure_ascii=False, indent=1)};\n')
    open('ninjas/sheet-auras.js', 'w').write(js)
    print(len(out), 'ninjas :', ', '.join(out))

if __name__ == '__main__':
    main(sys.argv[1])
