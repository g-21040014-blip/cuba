declare global {
  interface Window {
    google: any;
  }
}

export type ViewType = 
  | 'dashboard'
  | 'upload-data'
  | 'register-block'
  | 'register-room'
  | 'register-student'
  | 'register-warden'
  | 'register-committee'
  | 'org-chart-warden'
  | 'org-chart-student'
  | 'nfc-scanner'
  | 'apply-out-child'
  | 'apply-out-student'
  | 'approve-out'
  | 'record-out'
  | 'record-in'
  | 'record-school-out'
  | 'record-school-in'
  | 'school-attendance-stats'
  | 'data-report';

export interface MenuItem {
  id: ViewType;
  label: string;
  icon: string;
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}
