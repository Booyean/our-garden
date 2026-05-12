/**
 * ==========================================
 *   紫米芽和六角星的港湾 - 全局配置
 *   修改下面的值即可自定义整个网站
 * ==========================================
 */

var APP_CONFIG = {

  // ---- 基本信息 ----
  SITE_TITLE: '紫米芽和六角星的港湾',
  HER_NAME: '紫米芽',
  HIS_NAME: '六角星',

  // ---- 纪念日（格式: YYYY-MM-DD）----
  ANNIVERSARY_DATE: '2025-10-18',

  // ---- 花园密码（首次访问时设定，之后存 localStorage）----
  DEFAULT_PASSWORD: '',

  // ---- 暗号（在相册页连续点击计时器触发）----
  SURPRISE_PASSPHRASE: 'iloveyou',

  // ---- 作者头像 ----
  AUTHORS: [
    { id: 'star',   emoji: '🔯', label: '六角星' },
    { id: 'sheep',  emoji: '🐑', label: '紫米芽' }
  ],

  // ---- 心情列表 ----
  MOODS: [
    { emoji: '😊', name: '开心', color: '#FFD700' },
    { emoji: '🥺', name: '想念', color: '#87CEEB' },
    { emoji: '😢', name: '委屈', color: '#B0C4DE' },
    { emoji: '😍', name: '期待', color: '#FF69B4' },
    { emoji: '🥰', name: '幸福', color: '#FF9BB5' },
    { emoji: '😔', name: '难过', color: '#A9A9A9' }
  ],

  // ---- 背景配置 ----
  BACKGROUND: {
    // 默认背景图
    defaultBg: 'assets/bg/our-photo.jpg',

    // 各页面独立背景（没有对应文件时回退到默认）
    pageBgs: {
      diary:  'assets/bg/diary-bg.jpg',
      photo:  'assets/bg/photo-bg.jpg',
      wish:   'assets/bg/wish-bg.jpg'
    },

    // 遮罩颜色和透明度（值越小照片越清晰，推荐 0.65~0.85）
    overlayColor: 'rgba(255, 240, 245, 0.45)',

    // 模糊程度（px，值越小照片越清晰，推荐 4~8）
    blur: 3,

    // 纯色渐变备选背景（无照片时显示）
    fallbackGradient: 'linear-gradient(135deg, #FFF0F3 0%, #FFF8F0 40%, #F3E8FF 100%)',

    // 是否启用背景切换按钮
    enableSwitcher: true
  },

  // ---- 背景音乐配置 ----
  MUSIC: {
    defaultVolume: 0.5,
    defaultMode: 'sequential',
    playlist: [
      { name: 'A Thousand Years', src: 'assets/music/A Thousand Years.mp3' },
      { name: 'One Last Time', src: 'assets/music/One Last Time.mp3' },
    ]
  },

  // ---- API 基础路径（部署后无需修改）----
  API_BASE: '',

  // ---- 本地存储 Key ----
  STORAGE_KEYS: {
    PASSWORD: 'our_garden_pwd',
    AUTHOR: 'our_garden_author',
    DIARIES: 'our_garden_diaries',
    PHOTOS: 'our_garden_photos',
    WISHES: 'our_garden_wishes',
    BG_CHOICE: 'our_garden_bg'
  }
};
