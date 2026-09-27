export const ALL_ROOM_NUMBERS: string[] = [
  ...Array.from({ length: 54 }, (_, i) => `Old Room ${(i + 1).toString().padStart(2, '0')}`),
  ...Array.from({ length: 28 }, (_, i) => `New Room ${(i + 1).toString().padStart(2, '0')}`)
];
