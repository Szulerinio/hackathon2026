const AV_COLORS = ["av-0", "av-1", "av-2", "av-3", "av-4", "av-5"];

export function avatarClass(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}
