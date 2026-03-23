export interface TorahOption {
  value: string;
  label: string;
  sub: string;
  category: "torah" | "holiday";
}

export const TORAH_PORTIONS: TorahOption[] = [
  // Weekly Parshiot
  { value: "bereishit", label: "In the Beginning", sub: "Parashat Bereishit", category: "torah" },
  { value: "noach", label: "Noah's Ark", sub: "Parashat Noach", category: "torah" },
  { value: "lech-lecha", label: "Abraham's Journey", sub: "Parashat Lech Lecha", category: "torah" },
  { value: "vayera", label: "Angels Visit Abraham", sub: "Parashat Vayera", category: "torah" },
  { value: "chayei-sarah", label: "A Bride for Isaac", sub: "Parashat Chayei Sarah", category: "torah" },
  { value: "toldot", label: "Jacob & Esau", sub: "Parashat Toldot", category: "torah" },
  { value: "vayetzei", label: "Jacob's Ladder", sub: "Parashat Vayetzei", category: "torah" },
  { value: "vayishlach", label: "Wrestling with an Angel", sub: "Parashat Vayishlach", category: "torah" },
  { value: "vayeshev", label: "Joseph's Coat of Colors", sub: "Parashat Vayeshev", category: "torah" },
  { value: "miketz", label: "Joseph in Egypt", sub: "Parashat Miketz", category: "torah" },
  { value: "vayigash", label: "Brothers Reunite", sub: "Parashat Vayigash", category: "torah" },
  { value: "shemot", label: "Baby Moses & the Basket", sub: "Parashat Shemot", category: "torah" },
  { value: "vaera", label: "The Ten Plagues Begin", sub: "Parashat Va'era", category: "torah" },
  { value: "bo", label: "The Exodus from Egypt", sub: "Parashat Bo", category: "torah" },
  { value: "beshalach", label: "The Parting of the Sea", sub: "Parashat Beshalach", category: "torah" },
  { value: "yitro", label: "The Ten Commandments", sub: "Parashat Yitro", category: "torah" },
  { value: "terumah", label: "Building the Tabernacle", sub: "Parashat Terumah", category: "torah" },
  { value: "bamidbar", label: "Counting in the Desert", sub: "Parashat Bamidbar", category: "torah" },
  { value: "balak", label: "Balaam's Talking Donkey", sub: "Parashat Balak", category: "torah" },
  // Jewish Holidays
  { value: "pesach", label: "The Passover Story", sub: "Pesach", category: "holiday" },
  { value: "purim", label: "Queen Esther Saves the Day", sub: "Purim", category: "holiday" },
  { value: "chanukah", label: "The Miracle of Lights", sub: "Chanukah", category: "holiday" },
  { value: "sukkot", label: "The Sukkah Adventure", sub: "Sukkot", category: "holiday" },
  { value: "shavuot", label: "Receiving the Torah", sub: "Shavuot", category: "holiday" },
  { value: "rosh-hashana", label: "The New Year's Shofar", sub: "Rosh Hashana", category: "holiday" },
  { value: "yom-kippur", label: "The Day of Forgiveness", sub: "Yom Kippur", category: "holiday" },
  { value: "simchat-torah", label: "Dancing with the Torah", sub: "Simchat Torah", category: "holiday" },
  { value: "tu-bishvat", label: "The Birthday of Trees", sub: "Tu B'Shvat", category: "holiday" },
  { value: "lag-baomer", label: "The Bonfire Festival", sub: "Lag B'Omer", category: "holiday" },
];

export const getPortionLabel = (value: string): string => {
  const found = TORAH_PORTIONS.find((p) => p.value === value);
  return found ? found.sub : value;
};
