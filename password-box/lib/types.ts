export type SiteType = 'entreprise' | 'ecole' | 'bureau' | 'appartement' | 'datacenter' | 'hotel' | 'hopital' | 'autre';
export type SiteMode = 'infrastructure' | 'personnel';

export type EquipmentType =
  | 'routeur' | 'switch' | 'firewall' | 'serveur' | 'pc' | 'laptop'
  | 'imprimante' | 'ap_wifi' | 'phone_ip' | 'cam_ip' | 'nas' | 'ups'
  | 'tablet' | 'pos' | 'pbx' | 'videooprojecteur' | 'badgeuse' | 'support_tv'
  | 'autre';

export type OSType =
  | 'windows_server' | 'windows_10' | 'windows_11' | 'windows_iot'
  | 'linux_ubuntu' | 'linux_centos' | 'linux_debian' | 'linux_redhat' | 'embedded_linux'
  | 'cisco_ios' | 'ios_xe' | 'mikrotik_routeros' | 'juniper_junos'
  | 'fortinet_fortios' | 'pfsense' | 'opnsense'
  | 'unifi_os' | 'vmware_esxi' | 'unraid'
  | 'synology_dsm' | 'qnap_qts'
  | 'macos' | 'ipados' | 'chromeos'
  | 'android' | 'ios' | 'autre';

export type AuthType = 'mot_de_passe' | 'cle_ssh' | 'certificat' | 'token' | 'snmp' | 'api_key' | 'autre';

import type { TranslationKey } from '../i18n/translations';

export interface Site {
  id: string;
  name: string;
  type: SiteType;
  mode?: SiteMode;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  siteId: string;
  name: string;
  type: EquipmentType;
  customType?: string;
  os: OSType;
  customOS?: string;
  brand?: string;
  hostname: string;
  ipAddress: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Credential {
  id: string;
  equipmentId: string;
  label: string;
  authType: AuthType;
  username: string;
  password: string;
  port: string;
  extraInfo: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  version: string;
  exportedAt: string;
  sites: Site[];
  equipment: Equipment[];
  credentials: Credential[];
}

export interface PassFile {
  magic: 'PBX1';
  whitelist: string[];
  payload: string;
}

export const SITE_TYPE_LABELS: Record<SiteType, TranslationKey> = {
  entreprise: 'site.type.entreprise',
  ecole: 'site.type.ecole',
  bureau: 'site.type.bureau',
  appartement: 'site.type.appartement',
  datacenter: 'site.type.datacenter',
  hotel: 'site.type.hotel',
  hopital: 'site.type.hopital',
  autre: 'site.type.autre',
};

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, TranslationKey> = {
  routeur: 'equipment.type.routeur',
  switch: 'equipment.type.switch',
  firewall: 'equipment.type.firewall',
  serveur: 'equipment.type.serveur',
  pc: 'equipment.type.pc',
  laptop: 'equipment.type.laptop',
  imprimante: 'equipment.type.imprimante',
  ap_wifi: 'equipment.type.ap_wifi',
  phone_ip: 'equipment.type.phone_ip',
  cam_ip: 'equipment.type.cam_ip',
  nas: 'equipment.type.nas',
  ups: 'equipment.type.ups',
  tablet: 'equipment.type.tablet',
  pos: 'equipment.type.pos',
  pbx: 'equipment.type.pbx',
  videooprojecteur: 'equipment.type.videooprojecteur',
  badgeuse: 'equipment.type.badgeuse',
  support_tv: 'equipment.type.support_tv',
  autre: 'equipment.type.autre',
};

export const OS_LABELS: Record<OSType, TranslationKey> = {
  windows_server: 'os.windows_server',
  windows_10: 'os.windows_10',
  windows_11: 'os.windows_11',
  windows_iot: 'os.windows_iot',
  linux_ubuntu: 'os.linux_ubuntu',
  linux_centos: 'os.linux_centos',
  linux_debian: 'os.linux_debian',
  linux_redhat: 'os.linux_redhat',
  embedded_linux: 'os.embedded_linux',
  cisco_ios: 'os.cisco_ios',
  ios_xe: 'os.ios_xe',
  mikrotik_routeros: 'os.mikrotik_routeros',
  juniper_junos: 'os.juniper_junos',
  fortinet_fortios: 'os.fortinet_fortios',
  pfsense: 'os.pfsense',
  opnsense: 'os.opnsense',
  unifi_os: 'os.unifi_os',
  vmware_esxi: 'os.vmware_esxi',
  unraid: 'os.unraid',
  synology_dsm: 'os.synology_dsm',
  qnap_qts: 'os.qnap_qts',
  macos: 'os.macos',
  ipados: 'os.ipados',
  chromeos: 'os.chromeos',
  android: 'os.android',
  ios: 'os.ios',
  autre: 'os.autre',
};

export const AUTH_TYPE_LABELS: Record<AuthType, TranslationKey> = {
  mot_de_passe: 'authType.mot_de_passe',
  cle_ssh: 'authType.cle_ssh',
  certificat: 'authType.certificat',
  token: 'authType.token',
  snmp: 'authType.snmp',
  api_key: 'authType.api_key',
  autre: 'authType.autre',
};

export const SITE_ICONS: Record<SiteType, string> = {
  entreprise: 'business',
  ecole: 'school',
  bureau: 'work',
  appartement: 'home',
  datacenter: 'cloud',
  hotel: 'hotel',
  hopital: 'local-hospital',
  autre: 'location-on',
};

export const EQUIPMENT_ICONS: Record<EquipmentType, string> = {
  routeur: 'router',
  switch: 'hub',
  firewall: 'security',
  serveur: 'dns',
  pc: 'desktop-windows',
  laptop: 'laptop',
  imprimante: 'print',
  ap_wifi: 'wifi',
  phone_ip: 'phone',
  cam_ip: 'videocam',
  nas: 'storage',
  ups: 'battery-charging-full',
  tablet: 'tablet',
  pos: 'point-of-sale',
  pbx: 'settings-input-antenna',
  videooprojecteur: 'videocam',
  badgeuse: 'fingerprint',
  support_tv: 'tv',
  autre: 'devices-other',
};

export const COMPATIBLE_OS_MAP: Record<EquipmentType, OSType[]> = {
  routeur: [
    'cisco_ios', 'ios_xe', 'mikrotik_routeros', 'juniper_junos',
    'fortinet_fortios', 'pfsense', 'opnsense', 'linux_debian',
    'windows_server', 'autre',
  ],
  switch: [
    'cisco_ios', 'ios_xe', 'unifi_os', 'mikrotik_routeros',
    'juniper_junos', 'autre',
  ],
  firewall: [
    'fortinet_fortios', 'pfsense', 'opnsense', 'cisco_ios', 'ios_xe',
    'mikrotik_routeros', 'juniper_junos', 'linux_ubuntu', 'linux_debian',
    'windows_server', 'autre',
  ],
  serveur: [
    'windows_server', 'linux_ubuntu', 'linux_centos', 'linux_debian',
    'linux_redhat', 'vmware_esxi', 'unraid', 'synology_dsm',
    'qnap_qts', 'autre',
  ],
  pc: [
    'windows_10', 'windows_11', 'linux_ubuntu', 'linux_debian',
    'linux_centos', 'linux_redhat', 'chromeos', 'autre',
  ],
  laptop: [
    'windows_10', 'windows_11', 'linux_ubuntu', 'linux_debian',
    'macos', 'chromeos', 'autre',
  ],
  imprimante: [
    'embedded_linux', 'windows_iot', 'autre',
  ],
  ap_wifi: [
    'unifi_os', 'cisco_ios', 'ios_xe', 'mikrotik_routeros', 'autre',
  ],
  phone_ip: [
    'embedded_linux', 'android', 'autre',
  ],
  cam_ip: [
    'embedded_linux', 'android', 'autre',
  ],
  nas: [
    'synology_dsm', 'qnap_qts', 'linux_debian', 'linux_ubuntu',
    'linux_centos', 'unraid', 'autre',
  ],
  ups: [
    'embedded_linux', 'autre',
  ],
  tablet: [
    'ipados', 'android', 'windows_11', 'autre',
  ],
  pos: [
    'windows_10', 'windows_11', 'linux_ubuntu', 'linux_debian',
    'android', 'embedded_linux', 'autre',
  ],
  pbx: [
    'linux_ubuntu', 'linux_debian', 'linux_centos', 'embedded_linux',
    'windows_server', 'autre',
  ],
  videooprojecteur: [
    'embedded_linux', 'android', 'autre',
  ],
  badgeuse: [
    'linux_ubuntu', 'linux_debian', 'embedded_linux', 'android',
    'windows_iot', 'autre',
  ],
  support_tv: [
    'android', 'embedded_linux', 'autre',
  ],
  autre: [
    'windows_server', 'windows_10', 'windows_11', 'windows_iot',
    'linux_ubuntu', 'linux_centos', 'linux_debian', 'linux_redhat',
    'embedded_linux', 'cisco_ios', 'ios_xe', 'mikrotik_routeros',
    'juniper_junos', 'fortinet_fortios', 'pfsense', 'opnsense',
    'unifi_os', 'vmware_esxi', 'unraid', 'synology_dsm', 'qnap_qts',
    'macos', 'ipados', 'chromeos', 'android', 'ios', 'autre',
  ],
};

export const BRANDS_BY_TYPE: Record<EquipmentType, string[]> = {
  routeur: [
    'Cisco', 'Juniper', 'Fortinet', 'MikroTik', 'Ubiquiti', 'Aruba',
    'HPE', 'Dell', 'Palo Alto', 'Sophos', 'WatchGuard', 'Netgear',
    'TP-Link', 'D-Link', 'Zyxel', 'Allied Telesis', 'Ruckus',
    'Meraki', 'Barracuda', 'SonicWall', 'Huawei', 'Planet',
  ],
  switch: [
    'Cisco', 'Juniper', 'Aruba', 'HPE', 'Ubiquiti', 'Netgear',
    'TP-Link', 'D-Link', 'Zyxel', 'Dell', 'MikroTik', 'Ruckus',
    'Meraki', 'Extreme Networks', 'Brocade', 'Allied Telesis',
  ],
  firewall: [
    'Fortinet', 'Palo Alto', 'Cisco', 'Sophos', 'WatchGuard',
    'Juniper', 'SonicWall', 'Barracuda', 'pfSense', 'OPNsense',
    'Check Point', 'Zyxel', 'Huawei', 'Meraki', 'Forcepoint',
  ],
  serveur: [
    'Dell', 'HPE', 'Lenovo', 'Supermicro', 'Cisco', 'Fujitsu',
    'Oracle', 'IBM', 'Inspur', 'Huawei', 'Hikvision',
  ],
  pc: [
    'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Apple',
    'Samsung', 'Toshiba', 'Fujitsu', 'Packard Bell', 'Medion',
    'Sony', 'Gateway', 'Compaq', 'Chromebox',
  ],
  laptop: [
    'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Apple',
    'Samsung', 'Toshiba', 'Fujitsu', 'Microsoft', 'Huawei',
    'Razer', 'LG', 'Google', 'Framework',
  ],
  imprimante: [
    'HP', 'Canon', 'Brother', 'Epson', 'Xerox', 'Lexmark',
    'Samsung', 'Ricoh', 'Konica Minolta', 'Kyocera', 'OKI',
    'Sharp', 'Dell', 'Zebra', 'Citizen', 'Evolis', 'Datacard',
  ],
  ap_wifi: [
    'Ubiquiti', 'Cisco', 'Aruba', 'Ruckus', 'Meraki', 'TP-Link',
    'Netgear', 'Cambium', 'D-Link', 'Extreme Networks', 'Fortinet',
    'WatchGuard', 'SonicWall',
  ],
  phone_ip: [
    'Cisco', 'Yealink', 'Polycom', 'Avaya', 'Grandstream', 'Mitel',
    'Snom', 'Fanvil', 'AudioCodes', 'Dinstar', 'Htek', 'Obihai',
  ],
  cam_ip: [
    'Hikvision', 'Dahua', 'Axis', 'Ubiquiti', 'Reolink', 'Amcrest',
    'Bosch', 'Hanwha', 'Vivotek', 'FLIR', 'Arecont Vision',
    'Uniview', 'CP Plus', 'TVT',
  ],
  nas: [
    'Synology', 'QNAP', 'Western Digital', 'Buffalo', 'Asustor',
    'TrueNAS', 'Netgear', 'TerraMaster', 'Seagate', 'LaCie',
    'Drobo', 'Promise Technology',
  ],
  ups: [
    'APC', 'Eaton', 'CyberPower', 'Vertiv', 'Tripp Lite', 'Huawei',
    'Legrand', 'Schneider Electric', 'Riello', 'AEG', 'Borri',
    'Socomec', 'Emerson',
  ],
  tablet: [
    'Apple', 'Samsung', 'Microsoft', 'Lenovo', 'Huawei', 'Xiaomi',
    'Amazon', 'Google', 'Dell', 'HP',
  ],
  pos: [
    'Oracle', 'Toshiba', 'Ingenico', 'Verifone', 'Zebra', 'Elo',
    'Bematech', 'Partner Tech', 'NCR', 'Square', 'SumUp',
    'Lightspeed', 'PAX', 'Newland',
  ],
  pbx: [
    'Avaya', 'Cisco', 'Mitel', '3CX', 'FreePBX', 'Grandstream',
    'Yealink', 'Fanvil', '2N', 'Swyx', 'NEC', 'Siemens',
    'Alcatel-Lucent', 'Unify',
  ],
  videooprojecteur: [
    'Epson', 'BenQ', 'ViewSonic', 'Optoma', 'NEC', 'Panasonic',
    'Sony', 'Canon', 'Hitachi', 'Casio', 'Acer', 'ASUS',
    'LG', 'Samsung',
  ],
  badgeuse: [
    'HID', 'Suprema', 'ZKTeco', 'Paxton', 'Ideal', 'Gallagher',
    'Bosch', 'SALTO', 'Honeywell', 'Lenel', 'Axis', 'TDSi',
    'Inner Range', 'Alarm Lock',
  ],
  support_tv: [
    'Samsung', 'LG', 'Philips', 'ViewSonic', 'BrightSign', 'NEC',
    'Sharp', 'Sony', 'Panasonic', 'BenQ', 'Elo', 'iiyama',
    'Oracle', 'Toshiba',
  ],
  autre: [],
};

export function getEquipmentTypeLabel(equipment: Equipment): string {
  if (equipment.type === 'autre' && equipment.customType) {
    return equipment.customType;
  }
  return EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type;
}

export function getOSLabel(equipment: Equipment): string {
  if (equipment.os === 'autre' && equipment.customOS) {
    return equipment.customOS;
  }
  return OS_LABELS[equipment.os] ?? equipment.os;
}

export function getSiteMode(site: Site): SiteMode {
  return site.mode ?? 'infrastructure';
}

export interface PersonalServiceCategory {
  label: TranslationKey;
  icon: string;
  services: { name: string; icon: string }[];
}

export const PERSONAL_SERVICE_CATEGORIES: PersonalServiceCategory[] = [
  {
    label: 'personal.category.social',
    icon: 'people',
    services: [
      { name: 'Facebook', icon: 'facebook' },
      { name: 'Instagram', icon: 'camera-alt' },
      { name: 'Twitter / X', icon: 'tag' },
      { name: 'LinkedIn', icon: 'work' },
      { name: 'TikTok', icon: 'music-note' },
      { name: 'Snapchat', icon: 'ghost' },
      { name: 'Pinterest', icon: 'push-pin' },
      { name: 'Reddit', icon: 'forum' },
    ],
  },
  {
    label: 'personal.category.messaging',
    icon: 'email',
    services: [
      { name: 'Gmail', icon: 'mail' },
      { name: 'Outlook', icon: 'mail-outline' },
      { name: 'Yahoo Mail', icon: 'mail' },
      { name: 'ProtonMail', icon: 'enhanced-encryption' },
      { name: 'iCloud Mail', icon: 'cloud' },
    ],
  },
  {
    label: 'personal.category.banking',
    icon: 'account-balance',
    services: [
      { name: 'PayPal', icon: 'payment' },
      { name: 'Stripe', icon: 'payment' },
      { name: 'Revolut', icon: 'account-balance-wallet' },
      { name: 'Boursorama', icon: 'account-balance' },
      { name: 'Hello bank', icon: 'account-balance' },
    ],
  },
  {
    label: 'personal.category.entertainment',
    icon: 'play-circle',
    services: [
      { name: 'Netflix', icon: 'movie' },
      { name: 'Spotify', icon: 'music-note' },
      { name: 'YouTube', icon: 'play-circle' },
      { name: 'Disney+', icon: 'movie' },
      { name: 'Amazon Prime Video', icon: 'movie' },
      { name: 'Apple Music', icon: 'music-note' },
      { name: 'Deezer', icon: 'music-note' },
      { name: 'Twitch', icon: 'videocam' },
    ],
  },
  {
    label: 'personal.category.cloud',
    icon: 'cloud',
    services: [
      { name: 'Google Drive', icon: 'cloud' },
      { name: 'Dropbox', icon: 'cloud-sync' },
      { name: 'OneDrive', icon: 'cloud' },
      { name: 'iCloud', icon: 'cloud' },
      { name: 'Mega', icon: 'cloud' },
      { name: 'pCloud', icon: 'cloud' },
    ],
  },
  {
    label: 'personal.category.ecommerce',
    icon: 'shopping-cart',
    services: [
      { name: 'Amazon', icon: 'shopping-cart' },
      { name: 'eBay', icon: 'shopping-cart' },
      { name: 'AliExpress', icon: 'shopping-cart' },
      { name: 'Leboncoin', icon: 'shopping-cart' },
      { name: 'Cdiscount', icon: 'shopping-cart' },
      { name: 'Fnac', icon: 'shopping-cart' },
    ],
  },
  {
    label: 'personal.category.gaming',
    icon: 'sports-esports',
    services: [
      { name: 'Steam', icon: 'sports-esports' },
      { name: 'Epic Games', icon: 'sports-esports' },
      { name: 'PlayStation Network', icon: 'sports-esports' },
      { name: 'Xbox Live', icon: 'sports-esports' },
      { name: 'Nintendo Account', icon: 'sports-esports' },
      { name: 'Discord', icon: 'forum' },
      { name: 'Origin / EA', icon: 'sports-esports' },
      { name: 'Ubisoft Connect', icon: 'sports-esports' },
    ],
  },
  {
    label: 'personal.category.productivity',
    icon: 'business-center',
    services: [
      { name: 'Microsoft 365', icon: 'description' },
      { name: 'Google Workspace', icon: 'description' },
      { name: 'Notion', icon: 'notes' },
      { name: 'Trello', icon: 'view-module' },
      { name: 'Slack', icon: 'chat' },
      { name: 'Zoom', icon: 'videocam' },
      { name: 'Teams', icon: 'chat' },
    ],
  },
  {
    label: 'personal.category.telecom',
    icon: 'phone',
    services: [
      { name: 'Free', icon: 'wifi' },
      { name: 'Orange', icon: 'wifi' },
      { name: 'SFR', icon: 'wifi' },
      { name: 'Bouygues Telecom', icon: 'wifi' },
      { name: 'WhatsApp', icon: 'chat' },
      { name: 'Telegram', icon: 'chat' },
      { name: 'Signal', icon: 'chat' },
    ],
  },
  {
    label: 'personal.category.dev',
    icon: 'code',
    services: [
      { name: 'GitHub', icon: 'code' },
      { name: 'GitLab', icon: 'code' },
      { name: 'Bitbucket', icon: 'code' },
      { name: 'npm', icon: 'code' },
      { name: 'Docker Hub', icon: 'view-module' },
      { name: 'Vercel', icon: 'cloud' },
      { name: 'Netlify', icon: 'cloud' },
      { name: 'AWS', icon: 'cloud' },
      { name: 'Google Cloud', icon: 'cloud' },
      { name: 'Azure', icon: 'cloud' },
    ],
  },
  {
    label: 'personal.category.everyday',
    icon: 'home',
    services: [
      { name: 'Uber', icon: 'directions-car' },
      { name: 'Bolt', icon: 'directions-car' },
      { name: 'Deliveroo', icon: 'restaurant' },
      { name: 'Uber Eats', icon: 'restaurant' },
      { name: 'Booking.com', icon: 'hotel' },
      { name: 'Airbnb', icon: 'hotel' },
      { name: 'SNCF Connect', icon: 'train' },
    ],
  },
];

export const ALL_PERSONAL_SERVICES: { name: string; icon: string }[] =
  PERSONAL_SERVICE_CATEGORIES.flatMap((cat) => cat.services);
