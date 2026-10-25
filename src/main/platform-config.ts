import { PlatformConfig, PlatformId } from '../types';

export const PLATFORM_CONFIGS: Record<PlatformId, PlatformConfig> = {
  douyin: {
    id: 'douyin',
    name: '抖音',
    englishName: 'Douyin',
    badge: '短视频·直播',
    brandColor: '#161823',
    accentColor: '#FE2C55',
    homeUrl: 'https://www.douyin.com/',
    searchUrlTemplate: 'https://www.douyin.com/search/{query}',
    loginUrl: 'https://www.douyin.com/',
    partition: 'persist:douyin',
    categories: [
      { id: 'recommend', name: '精选推荐', url: 'https://www.douyin.com/' },
      { id: 'hot', name: '热点榜单', url: 'https://www.douyin.com/hot' },
      { id: 'live', name: '直播大厅', url: 'https://www.douyin.com/live' },
      { id: 'entertainment', name: '娱乐', url: 'https://www.douyin.com/channel/300201' },
      { id: 'anime', name: '二次元', url: 'https://www.douyin.com/channel/300209' },
      { id: 'knowledge', name: '知识', url: 'https://www.douyin.com/channel/300205' },
      { id: 'game', name: '游戏', url: 'https://www.douyin.com/channel/300203' },
      { id: 'food', name: '美食', url: 'https://www.douyin.com/channel/300206' },
    ],
  },
  bilibili: {
    id: 'bilibili',
    name: '哔哩哔哩',
    englishName: 'Bilibili',
    badge: '弹幕·中长视频',
    brandColor: '#00AEEC',
    accentColor: '#FB7299',
    homeUrl: 'https://www.bilibili.com/',
    searchUrlTemplate: 'https://search.bilibili.com/all?keyword={query}',
    loginUrl: 'https://passport.bilibili.com/login',
    partition: 'persist:bilibili',
    categories: [
      { id: 'home', name: '首页推荐', url: 'https://www.bilibili.com/' },
      { id: 'popular', name: '热门精选', url: 'https://www.bilibili.com/v/popular/all' },
      { id: 'douga', name: '动画', url: 'https://www.bilibili.com/v/douga' },
      { id: 'game', name: '游戏', url: 'https://www.bilibili.com/v/game' },
      { id: 'technology', name: '数码科技', url: 'https://www.bilibili.com/v/technology' },
      { id: 'knowledge', name: '知识视野', url: 'https://www.bilibili.com/v/knowledge' },
      { id: 'music', name: '音乐', url: 'https://www.bilibili.com/v/music' },
      { id: 'cinema', name: '影视放映', url: 'https://www.bilibili.com/cinema/' },
      { id: 'life', name: '生活日常', url: 'https://www.bilibili.com/v/life' },
    ],
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书',
    englishName: 'Xiaohongshu',
    badge: '生活·图文视频',
    brandColor: '#FF2442',
    accentColor: '#FF5363',
    homeUrl: 'https://www.xiaohongshu.com/explore',
    searchUrlTemplate: 'https://www.xiaohongshu.com/search_result?keyword={query}',
    loginUrl: 'https://www.xiaohongshu.com/explore',
    partition: 'persist:xiaohongshu',
    categories: [
      { id: 'explore', name: '探索发现', url: 'https://www.xiaohongshu.com/explore' },
      { id: 'fashion', name: '穿搭时尚', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.fashion_v3' },
      { id: 'food', name: '美食探店', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.food_v3' },
      { id: 'cosmetics', name: '彩妆护肤', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.cosmetics_v3' },
      { id: 'movie', name: '影视追剧', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.movie_and_tv_v3' },
      { id: 'career', name: '职场干货', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.career_v3' },
      { id: 'home', name: '家居装潢', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.home_v3' },
      { id: 'game', name: '游戏日常', url: 'https://www.xiaohongshu.com/explore?channel_id=homefeed.game_v3' },
    ],
  },
};

export const PLATFORM_ALLOWED_DOMAINS: Record<PlatformId, string[]> = {
  douyin: [
    'douyin.com',
    'iesdouyin.com',
    'bytedance.com',
    'zijieapi.com',
    'byteoversea.com',
    'volcengine.com',
    'douyincdn.com',
    'douyinliving.com',
    'snssdk.com',
    'amemv.com',
    'v.douyin.com',
  ],
  bilibili: [
    'bilibili.com',
    'bilivideo.com',
    'hdslb.com',
    'biliapi.net',
    'bilibili.tv',
    'bilivideo.cn',
    'b23.tv',
  ],
  xiaohongshu: [
    'xiaohongshu.com',
    'xhscdn.com',
    'xiaohongshu.cn',
    'xhscdn.net',
    'xhslink.com',
  ],
};

export function isUrlAllowedForPlatform(url: string, platform: PlatformId): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    const domains = PLATFORM_ALLOWED_DOMAINS[platform] || [];
    return domains.some((domain) => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

export function getPlatformForUrl(url: string): PlatformId | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const hostname = parsed.hostname.toLowerCase();
    for (const p of ['bilibili', 'douyin', 'xiaohongshu'] as const) {
      const domains = PLATFORM_ALLOWED_DOMAINS[p];
      if (domains.some((domain) => hostname === domain || hostname.endsWith('.' + domain))) {
        return p;
      }
    }
  } catch {
    return null;
  }
  return null;
}
