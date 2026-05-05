export interface ConcreteData {
  ID: string;
  [key: string]: any;
}

export type SheetType = 'DASHBOARD' | 'PV' | 'TACHES' | 'PROJETS' | 'RESPONSABLES' | 'LIVREURS';

export const SHEET_CONFIG: Record<SheetType, { label: string, color: string, icon: string }> = {
  DASHBOARD: { label: 'لوحة التحكم', color: 'slate', icon: 'LayoutGrid' },
  PV: { label: 'محاضر الخرسانة', color: 'sky', icon: 'Database' },
  TACHES: { label: 'المهام والعمليات', color: 'blue', icon: 'CheckSquare' },
  PROJETS: { label: 'إدارة المشاريع', color: 'amber', icon: 'Briefcase' },
  RESPONSABLES: { label: 'المسؤولين', color: 'violet', icon: 'Users' },
  LIVREURS: { label: 'موردي الخرسانة', color: 'rose', icon: 'Truck' }
};

export const COLUMN_HEADERS: Record<Exclude<SheetType, 'DASHBOARD'>, Record<string, string>> = {
  PV: {
    "ID": "ID",
    "PV N": "PV N",
    "DATE": "DATE",
    "HEURE": "HEURE",
    "CLIENT": "CLIENT",
    "ENTREPRISE DES TRAVAUX": "ENTREPRISE DES TRAVAUX",
    "PROJET": "PROJET",
    "PARTIE D'OUVRAGE": "PARTIE D'OUVRAGE",
    "MODE PRELEVEMENT": "MODE PRELEVEMENT",
    "TYPE PRELEVEMENT": "TYPE PRELEVEMENT",
    "CLASSE BETON": "CLASSE BETON",
    "AFFAISSEMENT (mm)": "AFFAISSEMENT (mm)",
    "REF CONE D'ABRAMS": "REF CONE D'ABRAMS",
    "TEMPERATURE AMBIANTE": "TEMPERATURE AMBIANTE",
    "TEMPERATURE BETON": "TEMPERATURE BETON",
    "REF THERMOMETRE": "REF THERMOMETRE",
    "POUR ESSAI": "POUR ESSAI",
    "TYPE DE MOULE": "TYPE DE MOULE",
    "NOMBRE DE MOULES": "NOMBRE DE MOULES",
    "SERIE DES MOULES": "SERIE DES MOULES",
    "INFOS BETON BETONNIERE": "INFOS BETON BETONNIERE",
    "INFOS BETON MANUELLE": "INFOS BETON MANUELLE",
    "INFOS BETON LIVRE": "INFOS BETON LIVRE",
    "LIVREUR BETON": "LIVREUR BETON",
    "N DE BON": "N DE BON",
    "L'HEURE DE DEPART": "L'HEURE DE DEPART",
    "GPS": "الموقع الجغرافي",
    "IMAGE": "الصورة"
  },
  TACHES: {
    "ID": "ID",
    "DATE": "DATE",
    "PROJET": "PROJET",
    "NOM TACHE": "NOM TACHE",
    "TYPE TACHE": "TYPE TACHE",
    "ENTREPRISE DES TRAVAUX": "ENTREPRISE DES TRAVAUX",
    "CHEF CHANTIER": "CHEF CHANTIER",
    "STATUT TACHE": "STATUT TACHE",
    "PRIORITE": "PRIORITE",
    "LIVREUR BETON": "LIVREUR BETON",
    "TYPE COULAGE": "TYPE COULAGE",
    "RESPONSABLE": "RESPONSABLE",
    "COMMENTAIRES": "COMMENTAIRES",
    "DERNIERE MISE A JOUR": "DERNIERE MISE A JOUR",
    "GPS": "الموقع الجغرافي",
    "IMAGE": "الصورة"
  },
  PROJETS: {
    "ID": "ID",
    "DATE": "DATE",
    "CLIENT": "CLIENT",
    "PROJET": "PROJET",
    "ICON": "ICON",
    "ENTREPRISE DES TRAVAUX": "ENTREPRISE DES TRAVAUX",
    "CHEF CHANTIER": "CHEF CHANTIER",
    "NUM": "NUM",
    "LOCALISATION": "LOCALISATION",
    "STATUT": "STATUT",
    "COMMENTAIRES": "COMMENTAIRES",
    "DERNIERE MISE A JOUR": "DERNIERE MISE A JOUR",
    "GPS": "الموقع الجغرافي",
    "IMAGE": "الصورة"
  },
  RESPONSABLES: {
    "ID": "ID",
    "NOM RESPONSABLE": "NOM RESPONSABLE",
    "NUM1": "NUM1",
    "NUM2": "NUM2",
    "EMAIL": "EMAIL"
  },
  LIVREURS: {
    "ID": "ID",
    "LIVREUR BETON": "LIVREUR BETON"
  }
};
