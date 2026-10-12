import { User, UserPermissions, UserRole } from '../types';

export const getDefaultPermissionsForRole = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'super_admin':
      return {
        canAccessDashboard: true,
        canAccessCrmPackages: true,
        canAccessInventory: true,
        canAccessBiAnalytics: true,
        canAccessTvBoard: true,
        canAccessPatients: true,
        canAccessAppointments: true,
        canAccessFinancials: true,
        canAccessDoctors: true,
        canAccessAdminSettings: true,
        canAccessLaboratory: true,
        canAccessEmrConsultation: true,
        canAccessAuditLogs: true,
        canEditPatients: true,
        canDeleteRecords: true,
        canApproveFinancials: true,
        canEnterPayments: true,
        canViewTotalFinancials: true,
        canAccessWhatsapp: true,
        canViewAnalytics: true,
      };
    case 'doctor':
      return {
        canAccessDashboard: true,
        canAccessCrmPackages: true,
        canAccessInventory: false,
        canAccessBiAnalytics: false,
        canAccessTvBoard: true,
        canAccessPatients: true,
        canAccessAppointments: true,
        canAccessFinancials: false,
        canAccessDoctors: false,
        canAccessAdminSettings: false,
        canAccessLaboratory: true,
        canAccessEmrConsultation: true,
        canAccessAuditLogs: false,
        canEditPatients: true,
        canDeleteRecords: false,
        canApproveFinancials: false,
        canEnterPayments: false,
        canViewTotalFinancials: false,
        canAccessWhatsapp: true,
        canViewAnalytics: false,
      };
    case 'receptionist':
      return {
        canAccessDashboard: true,
        canAccessCrmPackages: true,
        canAccessInventory: true,
        canAccessBiAnalytics: false,
        canAccessTvBoard: true,
        canAccessPatients: true,
        canAccessAppointments: true,
        canAccessFinancials: false,
        canAccessDoctors: false,
        canAccessAdminSettings: false,
        canAccessLaboratory: true,
        canAccessEmrConsultation: false,
        canAccessAuditLogs: false,
        canEditPatients: true,
        canDeleteRecords: false,
        canApproveFinancials: false,
        canEnterPayments: true,
        canViewTotalFinancials: false,
        canAccessWhatsapp: true,
        canViewAnalytics: false,
      };
    case 'accountant':
      return {
        canAccessDashboard: true,
        canAccessCrmPackages: false,
        canAccessInventory: true,
        canAccessBiAnalytics: true,
        canAccessTvBoard: false,
        canAccessPatients: false,
        canAccessAppointments: false,
        canAccessFinancials: true,
        canAccessDoctors: true,
        canAccessAdminSettings: false,
        canAccessLaboratory: false,
        canAccessEmrConsultation: false,
        canAccessAuditLogs: true,
        canEditPatients: false,
        canDeleteRecords: false,
        canApproveFinancials: true,
        canEnterPayments: true,
        canViewTotalFinancials: true,
        canAccessWhatsapp: false,
        canViewAnalytics: true,
      };
    case 'manager':
      return {
        canAccessDashboard: true,
        canAccessCrmPackages: true,
        canAccessInventory: true,
        canAccessBiAnalytics: true,
        canAccessTvBoard: true,
        canAccessPatients: true,
        canAccessAppointments: true,
        canAccessFinancials: true,
        canAccessDoctors: true,
        canAccessAdminSettings: false,
        canAccessLaboratory: true,
        canAccessEmrConsultation: true,
        canAccessAuditLogs: true,
        canEditPatients: true,
        canDeleteRecords: false,
        canApproveFinancials: true,
        canEnterPayments: true,
        canViewTotalFinancials: true,
        canAccessWhatsapp: true,
        canViewAnalytics: true,
      };
    default:
      return {
        canAccessDashboard: true,
        canAccessCrmPackages: false,
        canAccessInventory: false,
        canAccessBiAnalytics: false,
        canAccessTvBoard: true,
        canAccessPatients: true,
        canAccessAppointments: true,
        canAccessFinancials: false,
        canAccessDoctors: false,
        canAccessAdminSettings: false,
        canAccessLaboratory: false,
        canAccessEmrConsultation: false,
        canAccessAuditLogs: false,
        canEditPatients: false,
        canDeleteRecords: false,
        canApproveFinancials: false,
        canEnterPayments: false,
        canViewTotalFinancials: false,
        canAccessWhatsapp: true,
        canViewAnalytics: false,
      };
  }
};

export const hasTabAccess = (user: User, tabId: string): boolean => {
  if (user.role === 'super_admin') return true;
  const perms = user.permissions || getDefaultPermissionsForRole(user.role);

  switch (tabId) {
    case 'dashboard':
      return perms.canAccessDashboard;
    case 'crm_packages':
      return perms.canAccessCrmPackages;
    case 'inventory':
      return perms.canAccessInventory;
    case 'bi_analytics':
      return perms.canAccessBiAnalytics && perms.canViewAnalytics;
    case 'tv_board':
      return perms.canAccessTvBoard;
    case 'patients':
      return perms.canAccessPatients;
    case 'appointments_whatsapp':
      return perms.canAccessAppointments || perms.canAccessWhatsapp;
    case 'financials':
    case 'monthly_financial_cards':
      return perms.canAccessFinancials;
    case 'doctors':
      return perms.canAccessDoctors;
    case 'staff_attendance':
      return true; // Everyone / kiosk terminal can view or check in, or managers

    case 'laboratory':
      return perms.canAccessLaboratory;
    case 'emr_consultation':
      return perms.canAccessEmrConsultation;
    case 'audit_security':
      return perms.canAccessAuditLogs;
    case 'settings':
      return perms.canAccessAdminSettings;
    case 'consolidated_branches':
      return false;
    default:
      return true;
  }
};

export const modulePermissionList: { key: keyof UserPermissions; label: string; icon: string; category: string }[] = [
  { key: 'canAccessDashboard', label: 'داشبۆڕدی سەرەکی جوانکاری', icon: 'LayoutDashboard', category: 'بەشەکان' },
  { key: 'canAccessPatients', label: 'پڕۆفایلی چارەخوازان', icon: 'Users', category: 'بەشەکان' },
  { key: 'canAccessEmrConsultation', label: 'ڕاوێژکاری، چارەسەری پێست و فۆرم', icon: 'Stethoscope', category: 'بەشەکان' },
  { key: 'canAccessLaboratory', label: 'شیکاری پێست، قژ و پشکنین', icon: 'TestTube2', category: 'بەشەکان' },
  { key: 'canAccessAppointments', label: 'مەوعیدەکانی لەیزەر و وەتس ئەپ', icon: 'CalendarCheck2', category: 'بەشەکان' },
  { key: 'canAccessFinancials', label: 'حیسابات و داهاتی جوانکاری (ERP)', icon: 'DollarSign', category: 'بەشەکان' },
  { key: 'canAccessInventory', label: 'عەمباری فیلەر، بۆتۆکس و لەیزەر', icon: 'Package', category: 'بەشەکان' },
  { key: 'canAccessCrmPackages', label: 'CRM، ئەندامێتی و پاکێجەکانی جوانکاری', icon: 'Award', category: 'بەشەکان' },
  { key: 'canAccessBiAnalytics', label: 'ئاماری گەشە و داهات (BI)', icon: 'TrendingUp', category: 'بەشەکان' },
  { key: 'canAccessTvBoard', label: 'شاشەی هۆڵی نۆرەگرتنی TV', icon: 'Tv', category: 'بەشەکان' },
  { key: 'canAccessDoctors', label: 'پزیشکان و شارەزایانی جوانکاری', icon: 'UserCog', category: 'بەشەکان' },

  { key: 'canAccessAuditLogs', label: 'لۆگی ئاسایش و چاودێری سیستەم', icon: 'ShieldCheck', category: 'بەشەکان' },
  { key: 'canAccessAdminSettings', label: 'سوپەر ئەدمین و ڕێکخستنی سەنتەر', icon: 'Settings', category: 'بەشەکان' },
];

export const actionPermissionList: { key: keyof UserPermissions; label: string; description: string }[] = [
  { key: 'canEditPatients', label: 'تۆمار و دەستکاریکردنی چارەخوازان', description: 'توانای زیادکردن و نوێکردنەوەی پڕۆفایلی چارەخواز' },
  { key: 'canDeleteRecords', label: 'سڕینەوەی بەڵگە و داتاکان', description: 'مافی سڕینەوەی تۆماری چارەخواز، نۆرەکان، یان خەرجییەکان' },
  { key: 'canApproveFinancials', label: 'پەسەندکردنی بەڵگەنامەی دارایی', description: 'دەسەڵاتی پەسەندکردنی مووچەی ستاف و کڕینی کەرەستەی جوانکاری' },
  { key: 'canEnterPayments', label: 'تۆمارکردنی پارەی جلسەکان (Payments)', description: 'توانای داخڵکردنی وەسڵی پارەی لەیزەر، فیلەر و پاکێجەکان' },
  { key: 'canViewTotalFinancials', label: 'بینینی کۆی گشتی داهات و سندوقەکان', description: 'توانای بینینی کۆی گشتی پارەی هاتوو و سندوقی هەموو لقەکان' },
  { key: 'canAccessWhatsapp', label: 'دەسەڵاتی پەیوەندی وەتس ئەپ', description: 'ناردنی نامەی بیرهێنانەوە، ڕێنمایی دوای لەیزەر و پشتڕاستکردنەوە' },
  { key: 'canViewAnalytics', label: 'بینینی ئامار و ڕێپۆرتەکانی گەشە (BI)', description: 'بینینی گراف و ڕێپۆرتە شیکارییەکانی سەنتەری جوانکاری' },
];
