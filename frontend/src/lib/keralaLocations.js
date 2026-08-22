// Kerala Administrative Hierarchy Data: Geographical Order North to South
// State → District → Sub-District (Taluk) → Revenue Village

export const keralaLocations = [
  "All Kerala",
  "Kasaragod",
  "Kannur",
  "Wayanad",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Thrissur",
  "Ernakulam",
  "Idukki",
  "Kottayam",
  "Alappuzha",
  "Pathanamthitta",
  "Kollam",
  "Thiruvananthapuram"
];

export const KERALA_DISTRICTS = [
  "Kasaragod",
  "Kannur",
  "Wayanad",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Thrissur",
  "Ernakulam",
  "Idukki",
  "Kottayam",
  "Alappuzha",
  "Pathanamthitta",
  "Kollam",
  "Thiruvananthapuram"
];

export const KERALA_LOCATION_DATA = {
  state: "Kerala",
  districts: [
    {
      name: "Kasaragod",
      taluks: [
        { name: "Kasaragod", areas: ["Kasaragod Town", "Kumbla", "Badiadka", "Chengala", "Madhur"] },
        { name: "Hosdurg", areas: ["Kanhangad Town", "Nileshwaram", "Cheruvathur", "Trikarpur"] },
        { name: "Vellarikundu", areas: ["Vellarikundu Town", "Balal", "West Eleri", "East Eleri"] },
        { name: "Manjeshwaram", areas: ["Uppala", "Manjeshwar", "Paivalike", "Vorkady"] }
      ]
    },
    {
      name: "Kannur",
      taluks: [
        { name: "Kannur", areas: ["Kannur City", "Puzhathi", "Pallikkunnu", "Edakkad", "Azhikode"] },
        { name: "Thalassery", areas: ["Thalassery Town", "Kuthuparamba", "Panoor", "Dharmadam", "Chockli"] },
        { name: "Taliparamba", areas: ["Taliparamba Town", "Mayyil", "Kurumathur", "Chengalai"] },
        { name: "Iritty", areas: ["Iritty Town", "Payyavoor", "Ulikkal", "Aralam", "Kottiyoor"] },
        { name: "Payyanur", areas: ["Payyanur Town", "Cherupuzha", "Peringome", "Karivellur"] }
      ]
    },
    {
      name: "Wayanad",
      taluks: [
        { name: "Vythiri", areas: ["Kalpetta Town", "Vythiri", "Meppadi", "Pozhuthana", "Kaniyambetta"] },
        { name: "Sulthan Bathery", areas: ["Sulthan Bathery Town", "Ambalavayal", "Meenangadi", "Noolpuzha"] },
        { name: "Mananthavady", areas: ["Mananthavady Town", "Thirunelli", "Panamaram", "Edavaka", "Vellamunda"] }
      ]
    },
    {
      name: "Kozhikode",
      taluks: [
        { name: "Kozhikode", areas: ["Kozhikode City", "Beypore", "Cheruvannur", "Mavoor", "Kunnamangalam", "Feroke"] },
        { name: "Koyilandy", areas: ["Koyilandy Town", "Payyoli", "Perambra", "Atholi", "Balussery"] },
        { name: "Vadakara", areas: ["Vadakara Town", "Chombala", "Nadapuram", "Kuttiady", "Azhiyur"] },
        { name: "Thamarassery", areas: ["Thamarassery Town", "Koduvally", "Mukkom", "Thiruvambady"] }
      ]
    },
    {
      name: "Malappuram",
      taluks: [
        { name: "Eranad", areas: ["Manjeri", "Kondotty", "Edavanna", "Kuzhimanna", "Areacode"] },
        { name: "Nilambur", areas: ["Nilambur Town", "Wandoor", "Kalikavu", "Chaliyar", "Edakkara"] },
        { name: "Perinthalmanna", areas: ["Perinthalmanna Town", "Mankada", "Melattur", "Pulamanthole"] },
        { name: "Ponnani", areas: ["Ponnani Town", "Edappal", "Tavanur", "Vattamkulam"] },
        { name: "Tirur", areas: ["Tirur Town", "Tanur", "Kuttippuram", "Valanchery", "Parappanangadi"] },
        { name: "Tirurangadi", areas: ["Chemmad", "Kottakkal", "Thenhipalam", "Vengara"] },
        { name: "Kondotty", areas: ["Kondotty Town", "Pallikkal", "Nediyiruppu", "Vazhayur"] }
      ]
    },
    {
      name: "Palakkad",
      taluks: [
        { name: "Palakkad", areas: ["Palakkad Town", "Olavakkode", "Kalpathy", "Pirayiri", "Mundur"] },
        { name: "Alathur", areas: ["Alathur Town", "Nemmara", "Kizhakkancherry", "Tarur", "Vadakkencherry"] },
        { name: "Chittur", areas: ["Chittur-Thathamangalam", "Nallepilly", "Kozhinjampara", "Parambikulam"] },
        { name: "Mannarkkad", areas: ["Mannarkkad Town", "Agali", "Attappady", "Kanhirapuzha"] },
        { name: "Ottappalam", areas: ["Ottappalam Town", "Shoranur", "Cherpulassery", "Lakkidi"] },
        { name: "Pattambi", areas: ["Pattambi Town", "Koppam", "Thrithala", "Muthuthala"] }
      ]
    },
    {
      name: "Thrissur",
      taluks: [
        { name: "Thrissur", areas: ["Thrissur City", "Ollur", "Ayyanthole", "Poonkunnam", "Nandikkara"] },
        { name: "Chalakudy", areas: ["Chalakudy Town", "Kodassery", "Pariyaram", "Koratty"] },
        { name: "Chavakkad", areas: ["Chavakkad Town", "Guruvayur", "Punnayur", "Engandiyoor"] },
        { name: "Kodungallur", areas: ["Kodungallur Town", "Methala", "Poyya", "Srinagar"] },
        { name: "Mukundapuram", areas: ["Irinjalakuda Town", "Pudukkad", "Nellayi", "Muriyad"] },
        { name: "Thalapilly", areas: ["Wadakkanchery Town", "Pazhayannur", "Chelakkara", "Mullurkara"] },
        { name: "Kunnamkulam", areas: ["Kunnamkulam Town", "Choondal", "Kadavallur", "Porkulam"] }
      ]
    },
    {
      name: "Ernakulam",
      taluks: [
        { name: "Kochi", areas: ["Fort Kochi", "Mattancherry", "Palluruthy", "Kumbalangi", "Willingdon Island"] },
        { name: "Kanayannur", areas: ["Kakkanad", "Ernakulam City", "Thripunithura", "Edappally", "Kaloor", "Vytilla"] },
        { name: "Aluva", areas: ["Aluva Town", "Angamaly", "Nedumbassery", "Chengamanad", "Parakkadavu"] },
        { name: "Kunnathunad", areas: ["Perumbavoor", "Kizhakkambalam", "Kolencherry", "Vazhakulam", "Pattimattom"] },
        { name: "Muvattupuzha", areas: ["Muvattupuzha Town", "Piravom", "Koothattukulam", "Arakuzha", "Paipra"] },
        { name: "Kothamangalam", areas: ["Kothamangalam Town", "Kuttampuzha", "Neriamangalam", "Varappetty"] },
        { name: "Paravur", areas: ["North Paravur Town", "Cherai", "Varapuzha", "Eloor", "Chendamangalam"] }
      ]
    },
    {
      name: "Idukki",
      taluks: [
        { name: "Idukki", areas: ["Painavu", "Vazhathope", "Kanjikuzhy", "Upputhara"] },
        { name: "Thodupuzha", areas: ["Thodupuzha Town", "Muttom", "Karimannoor", "Udumbannoor"] },
        { name: "Devikulam", areas: ["Munnar", "Adimali", "Marayoor", "Vattavada"] },
        { name: "Peerumade", areas: ["Peerumade Town", "Kumily", "Vandiperiyar", "Elappara"] },
        { name: "Udumbanchola", areas: ["Nedumkandam", "Rajakkad", "Santhampara", "Kattappana"] }
      ]
    },
    {
      name: "Kottayam",
      taluks: [
        { name: "Kottayam", areas: ["Kottayam Town", "Ettumanoor", "Kumarakom", "Puthuppally", "Aymanam"] },
        { name: "Changanassery", areas: ["Changanassery Town", "Vazhappally", "Kurichy", "Karukachal"] },
        { name: "Vaikom", areas: ["Vaikom Town", "Kaduthuruthy", "Thalayolaparambu", "Chempu"] },
        { name: "Meenachil", areas: ["Pala Town", "Erattupetta", "Bharananganam", "Ramapuram"] },
        { name: "Kanjirappally", areas: ["Kanjirappally Town", "Mundakayam", "Erumely", "Ponkunnam"] }
      ]
    },
    {
      name: "Alappuzha",
      taluks: [
        { name: "Ambalappuzha", areas: ["Alappuzha Town", "Ambalappuzha", "Punnapra", "Aryad", "Mararikulam"] },
        { name: "Chengannur", areas: ["Chengannur Town", "Mannar", "Pandanad", "Mulakuzha", "Ala"] },
        { name: "Cherthala", areas: ["Cherthala Town", "Aroor", "Thuravoor", "Pattanakkad", "Kanjikkuzhi"] },
        { name: "Karthikappally", areas: ["Haripad", "Kayamkulam", "Arattupuzha", "Cheppad", "Muthukulam"] },
        { name: "Kuttanad", areas: ["Mankombu", "Champakulam", "Pulinkunnu", "Ramankary", "Neelamperoor"] },
        { name: "Mavelikkara", areas: ["Mavelikkara Town", "Thamarakkulam", "Bharanikkavu", "Vallikunnam", "Chunakkara"] }
      ]
    },
    {
      name: "Pathanamthitta",
      taluks: [
        { name: "Adoor", areas: ["Adoor", "Pandalam", "Kodumon", "Ezhamkulam", "Enadimangalam"] },
        { name: "Konni", areas: ["Konni", "Malayalapuzha", "Vallarcode", "Koodal", "Mylapra"] },
        { name: "Kozhencherry", areas: ["Pathanamthitta Town", "Kozhencherry", "Mallapuzhassery", "Elanthoor", "Naranganam"] },
        { name: "Ranni", areas: ["Ranni", "Pazhavangadi", "Perunad", "Vadasserikkara", "Cherukole"] },
        { name: "Mallappally", areas: ["Mallappally", "Anicadu", "Kallooppara", "Kunnamthanam", "Puramattom"] },
        { name: "Thiruvalla", areas: ["Thiruvalla Town", "Kaviyoor", "Kuttoor", "Kadapra", "Peringara"] }
      ]
    },
    {
      name: "Kollam",
      taluks: [
        { name: "Kollam", areas: ["Kollam City", "Thrikkadavoor", "Perinad", "Elampalloor", "Mayyanad", "Chathannoor"] },
        { name: "Karunagappally", areas: ["Karunagappally", "Chavara", "Panmana", "Oachira", "Thazhava"] },
        { name: "Kunnathur", areas: ["Sasthamkotta", "Kunnathur", "Sooranad North", "Sooranad South", "West Kallada"] },
        { name: "Kottarakkara", areas: ["Kottarakkara", "Neduvathur", "Veliyam", "Pooyappally", "Ezhukone"] },
        { name: "Punalur", areas: ["Punalur Town", "Anchal", "Edamon", "Thenmala", "Ariencavu"] },
        { name: "Pathanapuram", areas: ["Pathanapuram", "Piravanthoor", "Thalavoor", "Vilakudy", "Pattazhy"] }
      ]
    },
    {
      name: "Thiruvananthapuram",
      taluks: [
        { name: "Thiruvananthapuram", areas: ["Thiruvananthapuram City", "Vattiyoorkavu", "Kudappanakunnu", "Pattom", "Kowdiar", "Nemom", "Vizhinjam"] },
        { name: "Neyyattinkara", areas: ["Neyyattinkara", "Parassala", "Kunnathukal", "Kovalam", "Athiyannur", "Perumkadavila"] },
        { name: "Nedumangad", areas: ["Nedumangad", "Vellanad", "Palode", "Vithura", "Aryanad", "Vamanapuram"] },
        { name: "Chirayinkeezhu", areas: ["Attingal", "Chirayinkeezhu", "Kadakkavoor", "Vakkom", "Mudakkal"] },
        { name: "Varkala", areas: ["Varkala", "Edava", "Chemmaruthy", "Pallickal", "Madavoor"] },
        { name: "Kattakada", areas: ["Kattakada", "Malayinkeezhu", "Mareanalloor", "Amboori", "Kallikkad"] }
      ]
    }
  ]
};

// Helper functions
export const getDistricts = () => KERALA_LOCATION_DATA.districts.map((d) => d.name);

export const getTaluks = (district) => {
  const dist = KERALA_LOCATION_DATA.districts.find((d) => d.name.toLowerCase() === (district || '').toLowerCase());
  return dist ? dist.taluks.map((t) => t.name) : [];
};

export const getAreas = (district, taluk) => {
  const dist = KERALA_LOCATION_DATA.districts.find((d) => d.name.toLowerCase() === (district || '').toLowerCase());
  if (!dist) return [];
  const tal = dist.taluks.find((t) => t.name.toLowerCase() === (taluk || '').toLowerCase());
  return tal ? tal.areas : [];
};

export const formatLocation = (district, taluk, area) => {
  const parts = [area, taluk, district, 'Kerala'].filter(Boolean);
  return parts.join(', ');
};

// District Center Coordinates for Map Pan/Zoom
export const DISTRICT_COORDINATES = {
  "Kasaragod": { lat: 12.5102, lng: 74.9852, zoom: 11 },
  "Kannur": { lat: 11.8745, lng: 75.3704, zoom: 11 },
  "Wayanad": { lat: 11.6854, lng: 76.1320, zoom: 11 },
  "Kozhikode": { lat: 11.2588, lng: 75.7804, zoom: 11 },
  "Malappuram": { lat: 11.0510, lng: 76.0711, zoom: 11 },
  "Palakkad": { lat: 10.7867, lng: 76.6548, zoom: 11 },
  "Thrissur": { lat: 10.5276, lng: 76.2144, zoom: 11 },
  "Ernakulam": { lat: 9.9816, lng: 76.2999, zoom: 12 },
  "Idukki": { lat: 9.9189, lng: 77.1025, zoom: 10 },
  "Kottayam": { lat: 9.5916, lng: 76.5222, zoom: 11 },
  "Alappuzha": { lat: 9.4981, lng: 76.3388, zoom: 11 },
  "Pathanamthitta": { lat: 9.2648, lng: 76.7870, zoom: 11 },
  "Kollam": { lat: 8.8932, lng: 76.6141, zoom: 11 },
  "Thiruvananthapuram": { lat: 8.5241, lng: 76.9366, zoom: 12 }
};

// Taluk Center Coordinates for Kerala
export const TALUK_COORDINATES = {
  // Kasaragod
  "Kasaragod": { lat: 12.5102, lng: 74.9852, zoom: 13 },
  "Hosdurg": { lat: 12.3083, lng: 75.0917, zoom: 13 },
  "Vellarikundu": { lat: 12.3500, lng: 75.3333, zoom: 13 },
  "Manjeshwaram": { lat: 12.7100, lng: 74.8900, zoom: 13 },
  // Kannur
  "Kannur": { lat: 11.8745, lng: 75.3704, zoom: 13 },
  "Thalassery": { lat: 11.7491, lng: 75.4890, zoom: 13 },
  "Taliparamba": { lat: 12.0463, lng: 75.3584, zoom: 13 },
  "Iritty": { lat: 11.9792, lng: 75.6708, zoom: 13 },
  "Payyanur": { lat: 12.1009, lng: 75.2033, zoom: 13 },
  // Wayanad
  "Vythiri": { lat: 11.5513, lng: 76.0401, zoom: 13 },
  "Sulthan Bathery": { lat: 11.6644, lng: 76.2575, zoom: 13 },
  "Mananthavady": { lat: 11.8026, lng: 76.0035, zoom: 13 },
  // Kozhikode
  "Kozhikode": { lat: 11.2588, lng: 75.7804, zoom: 13 },
  "Koyilandy": { lat: 11.4394, lng: 75.6961, zoom: 13 },
  "Vadakara": { lat: 11.6083, lng: 75.5917, zoom: 13 },
  "Thamarassery": { lat: 11.4172, lng: 75.9348, zoom: 13 },
  // Malappuram
  "Eranad": { lat: 11.1218, lng: 76.1212, zoom: 13 },
  "Nilambur": { lat: 11.2764, lng: 76.2263, zoom: 13 },
  "Perinthalmanna": { lat: 10.9760, lng: 76.2254, zoom: 13 },
  "Ponnani": { lat: 10.7738, lng: 75.9254, zoom: 13 },
  "Tirur": { lat: 10.9167, lng: 75.9167, zoom: 13 },
  "Tirurangadi": { lat: 11.0428, lng: 75.9262, zoom: 13 },
  "Kondotty": { lat: 11.1447, lng: 75.9654, zoom: 13 },
  // Palakkad
  "Palakkad": { lat: 10.7867, lng: 76.6548, zoom: 13 },
  "Alathur": { lat: 10.6473, lng: 76.5471, zoom: 13 },
  "Chittur": { lat: 10.7022, lng: 76.7186, zoom: 13 },
  "Mannarkkad": { lat: 10.9880, lng: 76.4589, zoom: 13 },
  "Ottappalam": { lat: 10.7725, lng: 76.3811, zoom: 13 },
  "Pattambi": { lat: 10.8094, lng: 76.1772, zoom: 13 },
  // Thrissur
  "Thrissur": { lat: 10.5276, lng: 76.2144, zoom: 13 },
  "Chavakkad": { lat: 10.5898, lng: 76.0261, zoom: 13 },
  "Kodungallur": { lat: 10.2286, lng: 76.1947, zoom: 13 },
  "Mukundapuram": { lat: 10.3586, lng: 76.2153, zoom: 13 },
  "Chalakkudy": { lat: 10.3070, lng: 76.3335, zoom: 13 },
  "Thalapilly": { lat: 10.6667, lng: 76.2500, zoom: 13 },
  "Kunnamkulam": { lat: 10.6508, lng: 76.0711, zoom: 13 },
  // Ernakulam
  "Kanayannur": { lat: 9.9816, lng: 76.2999, zoom: 13 },
  "Aluva": { lat: 10.1076, lng: 76.3516, zoom: 13 },
  "Kochi": { lat: 9.9312, lng: 76.2673, zoom: 13 },
  "Kothamangalam": { lat: 10.0617, lng: 76.6277, zoom: 13 },
  "Kunnathunad": { lat: 10.0889, lng: 76.4389, zoom: 13 },
  "Muvattupuzha": { lat: 9.9810, lng: 76.5780, zoom: 13 },
  "Paravur": { lat: 10.1477, lng: 76.2307, zoom: 13 },
  // Idukki
  "Devikulam": { lat: 10.0617, lng: 77.1062, zoom: 13 },
  "Peermade": { lat: 9.5667, lng: 76.9833, zoom: 13 },
  "Thodupuzha": { lat: 9.8959, lng: 76.7184, zoom: 13 },
  "Udumbanchola": { lat: 9.8911, lng: 77.1706, zoom: 13 },
  "Idukki": { lat: 9.9189, lng: 77.1025, zoom: 13 },
  // Kottayam
  "Kottayam": { lat: 9.5916, lng: 76.5222, zoom: 13 },
  "Changanassery": { lat: 9.4447, lng: 76.5367, zoom: 13 },
  "Kanjirappally": { lat: 9.5572, lng: 76.7906, zoom: 13 },
  "Meenachil": { lat: 9.6975, lng: 76.7214, zoom: 13 },
  "Vaikom": { lat: 9.7497, lng: 76.3961, zoom: 13 },
  // Alappuzha
  "Ambalapuzha": { lat: 9.3800, lng: 76.3500, zoom: 13 },
  "Chengannur": { lat: 9.3174, lng: 76.6114, zoom: 13 },
  "Cherthala": { lat: 9.6847, lng: 76.3331, zoom: 13 },
  "Karthikappally": { lat: 9.2483, lng: 76.4589, zoom: 13 },
  "Kuttanad": { lat: 9.4167, lng: 76.4667, zoom: 13 },
  "Mavelikkara": { lat: 9.2667, lng: 76.5500, zoom: 13 },
  // Pathanamthitta
  "Adoor": { lat: 9.1528, lng: 76.7356, zoom: 13 },
  "Konni": { lat: 9.2442, lng: 76.8486, zoom: 13 },
  "Kozhencherry": { lat: 9.3400, lng: 76.7100, zoom: 13 },
  "Mallappally": { lat: 9.4489, lng: 76.6508, zoom: 13 },
  "Ranni": { lat: 9.3814, lng: 76.7869, zoom: 13 },
  "Thiruvalla": { lat: 9.3844, lng: 76.5744, zoom: 13 },
  // Kollam
  "Kollam": { lat: 8.8932, lng: 76.6141, zoom: 13 },
  "Karunagappally": { lat: 9.0544, lng: 76.5350, zoom: 13 },
  "Kunnathur": { lat: 9.0833, lng: 76.6500, zoom: 13 },
  "Kottarakkara": { lat: 8.9984, lng: 76.7709, zoom: 13 },
  "Punalur": { lat: 9.0186, lng: 76.9281, zoom: 13 },
  "Pathanapuram": { lat: 9.0864, lng: 76.8572, zoom: 13 },
  // Thiruvananthapuram
  "Thiruvananthapuram": { lat: 8.5241, lng: 76.9366, zoom: 13 },
  "Neyyattinkara": { lat: 8.3988, lng: 77.0863, zoom: 13 },
  "Nedumangad": { lat: 8.6046, lng: 76.9972, zoom: 13 },
  "Chirayinkeezhu": { lat: 8.6533, lng: 76.7878, zoom: 13 },
  "Varkala": { lat: 8.7379, lng: 76.7163, zoom: 13 },
  "Kattakada": { lat: 8.5083, lng: 77.0783, zoom: 13 }
};

// Village / Town / Locality Center Coordinates
export const AREA_COORDINATES = {
  // Kannur
  "Kurumathur": { lat: 12.0167, lng: 75.3980, zoom: 14 },
  "Taliparamba Town": { lat: 12.0463, lng: 75.3584, zoom: 14 },
  "Mayyil": { lat: 11.9686, lng: 75.4678, zoom: 14 },
  "Chengalai": { lat: 12.0250, lng: 75.4750, zoom: 14 },
  "Panoor": { lat: 11.7562, lng: 75.5684, zoom: 14 },
  "Thalassery Town": { lat: 11.7491, lng: 75.4890, zoom: 14 },
  "Kuthuparamba": { lat: 11.8292, lng: 75.5714, zoom: 14 },
  "Dharmadam": { lat: 11.7694, lng: 75.4611, zoom: 14 },
  "Chockli": { lat: 11.7222, lng: 75.5472, zoom: 14 },
  "Kannur City": { lat: 11.8745, lng: 75.3704, zoom: 14 },
  "Payyanur Town": { lat: 12.1009, lng: 75.2033, zoom: 14 },
  "Iritty Town": { lat: 11.9792, lng: 75.6708, zoom: 14 },
  // Wayanad
  "Meenangadi": { lat: 11.6608, lng: 76.1705, zoom: 14 },
  "Sulthan Bathery Town": { lat: 11.6644, lng: 76.2575, zoom: 14 },
  "Ambalavayal": { lat: 11.6167, lng: 76.2167, zoom: 14 },
  "Noolpuzha": { lat: 11.6333, lng: 76.3500, zoom: 14 },
  "Kalpetta Town": { lat: 11.6103, lng: 76.0828, zoom: 14 },
  "Vythiri": { lat: 11.5513, lng: 76.0401, zoom: 14 },
  "Meppadi": { lat: 11.5500, lng: 76.1333, zoom: 14 },
  "Mananthavady Town": { lat: 11.8026, lng: 76.0035, zoom: 14 },
  // Ernakulam
  "Edappally": { lat: 10.0261, lng: 76.3125, zoom: 14 },
  "Kakkanad": { lat: 10.0159, lng: 76.3419, zoom: 14 },
  "Aluva Town": { lat: 10.1076, lng: 76.3516, zoom: 14 },
  "Kochi City": { lat: 9.9312, lng: 76.2673, zoom: 14 },
  "Fort Kochi": { lat: 9.9658, lng: 76.2421, zoom: 14 },
  "Palarivattom": { lat: 10.0050, lng: 76.3075, zoom: 14 },
  "Kadavanthra": { lat: 9.9667, lng: 76.3000, zoom: 14 },
  "Thrikkakara": { lat: 10.0333, lng: 76.3333, zoom: 14 },
  // Thiruvananthapuram
  "Pattom": { lat: 8.5278, lng: 76.9431, zoom: 14 },
  "Vattiyoorkavu": { lat: 8.5206, lng: 76.9856, zoom: 14 },
  "Kowdiar": { lat: 8.5289, lng: 76.9622, zoom: 14 },
  "Thiruvananthapuram City": { lat: 8.5241, lng: 76.9366, zoom: 14 },
  "Kovalam": { lat: 8.4020, lng: 76.9780, zoom: 14 },
  "Vizhinjam": { lat: 8.3800, lng: 76.9900, zoom: 14 },
  // Kozhikode
  "Beypore": { lat: 11.1783, lng: 75.8089, zoom: 14 },
  "Kozhikode City": { lat: 11.2588, lng: 75.7804, zoom: 14 },
  "Koyilandy Town": { lat: 11.4394, lng: 75.6961, zoom: 14 },
  "Vadakara Town": { lat: 11.6083, lng: 75.5917, zoom: 14 }
};

export const getKeralaCoordinates = (district, taluk = '', area = '') => {
  if (area && AREA_COORDINATES[area]) {
    return AREA_COORDINATES[area];
  }
  if (taluk && TALUK_COORDINATES[taluk]) {
    return TALUK_COORDINATES[taluk];
  }
  if (district && DISTRICT_COORDINATES[district]) {
    return DISTRICT_COORDINATES[district];
  }
  return null;
};

// Helper function for Google Maps Geocode result
export const getAddressComponent = (result, type) => {
  if (!result || !result.address_components || !Array.isArray(result.address_components)) {
    return '';
  }
  const comp = result.address_components.find(
    (c) => c && c.types && Array.isArray(c.types) && c.types.includes(type)
  );
  return comp && comp.long_name ? comp.long_name.trim() : '';
};

// District Alias Map for Google Maps & OSM parsing
const DISTRICT_ALIASES = {
  'kasaragod': 'Kasaragod',
  'kasargod': 'Kasaragod',
  'kasargode': 'Kasaragod',
  'kannur': 'Kannur',
  'cannanore': 'Kannur',
  'wayanad': 'Wayanad',
  'wynad': 'Wayanad',
  'wynaad': 'Wayanad',
  'kozhikode': 'Kozhikode',
  'calicut': 'Kozhikode',
  'malappuram': 'Malappuram',
  'malapuram': 'Malappuram',
  'palakkad': 'Palakkad',
  'palghat': 'Palakkad',
  'thrissur': 'Thrissur',
  'trichur': 'Thrissur',
  'ernakulam': 'Ernakulam',
  'kochi': 'Ernakulam',
  'cochin': 'Ernakulam',
  'idukki': 'Idukki',
  'kottayam': 'Kottayam',
  'alappuzha': 'Alappuzha',
  'alleppey': 'Alappuzha',
  'allepy': 'Alappuzha',
  'pathanamthitta': 'Pathanamthitta',
  'kollam': 'Kollam',
  'quilon': 'Kollam',
  'thiruvananthapuram': 'Thiruvananthapuram',
  'trivandrum': 'Thiruvananthapuram'
};

export const normalizeDistrictName = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw.toLowerCase()
    .replace(/\bdistrict\b/gi, '')
    .replace(/\bdivision\b/gi, '')
    .replace(/\bcity\b/gi, '')
    .trim();
  
  if (!cleaned) return '';

  if (DISTRICT_ALIASES[cleaned]) {
    return DISTRICT_ALIASES[cleaned];
  }

  const directMatch = KERALA_DISTRICTS.find(d => d.toLowerCase() === cleaned);
  if (directMatch) return directMatch;

  // Split into words for whole-token matching
  const words = cleaned.split(/[\s,./-]+/).filter(w => w.length >= 3);
  for (const word of words) {
    if (DISTRICT_ALIASES[word]) {
      return DISTRICT_ALIASES[word];
    }
    const tokenMatch = KERALA_DISTRICTS.find(d => d.toLowerCase() === word);
    if (tokenMatch) return tokenMatch;
  }

  return '';
};

export const matchTaluk = (district, talukHint = '', addressHint = '') => {
  if (!district) return '';
  const taluks = getTaluks(district);
  if (!taluks || taluks.length === 0) return '';

  const cleanHint = (talukHint || '').toLowerCase().replace(/\btaluk\b/gi, '').trim();
  const cleanAddr = (addressHint || '').toLowerCase();

  // 1. Direct match with cleanHint
  if (cleanHint) {
    const direct = taluks.find(t => t.toLowerCase() === cleanHint);
    if (direct) return direct;
  }

  // 2. Word token match with cleanHint
  if (cleanHint) {
    const hintWords = cleanHint.split(/[\s,./-]+/).filter(w => w.length >= 3);
    for (const w of hintWords) {
      const match = taluks.find(t => t.toLowerCase() === w || t.toLowerCase().includes(w));
      if (match) return match;
    }
  }

  // 3. Match within address string
  if (cleanAddr) {
    for (const t of taluks) {
      const tLower = t.toLowerCase();
      // Match whole word in address
      const regex = new RegExp(`\\b${tLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(cleanAddr)) {
        return t;
      }
    }
  }

  // 4. Match based on known areas belonging to a taluk
  const distObj = KERALA_LOCATION_DATA.districts.find(d => d.name.toLowerCase() === district.toLowerCase());
  if (distObj) {
    for (const t of distObj.taluks) {
      for (const a of t.areas) {
        const areaName = a.toLowerCase();
        const areaRegex = new RegExp(`\\b${areaName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if ((cleanHint && areaRegex.test(cleanHint)) || (cleanAddr && areaRegex.test(cleanAddr))) {
          return t.name;
        }
      }
    }
  }

  return '';
};

export const matchArea = (district, taluk, areaHint = '', addressHint = '') => {
  if (!district || !taluk) return '';
  const areas = getAreas(district, taluk);
  if (!areas || areas.length === 0) return '';

  const cleanHint = (areaHint || '').toLowerCase().trim();
  const cleanAddr = (addressHint || '').toLowerCase();

  if (cleanHint) {
    const direct = areas.find(a => a.toLowerCase() === cleanHint);
    if (direct) return direct;

    const hintWords = cleanHint.split(/[\s,./-]+/).filter(w => w.length >= 3);
    for (const w of hintWords) {
      const match = areas.find(a => a.toLowerCase() === w || a.toLowerCase().includes(w));
      if (match) return match;
    }
  }

  if (cleanAddr) {
    for (const a of areas) {
      const aLower = a.toLowerCase();
      const regex = new RegExp(`\\b${aLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(cleanAddr)) {
        return a;
      }
    }
  }

  return '';
};

// Universal Reverse Geocoding Parser for Google Maps and OpenStreetMap Nominatim
export const parseReverseGeocode = (data) => {
  if (!data) {
    return {
      district: '',
      taluk: '',
      area: '',
      address: '',
      isKerala: false,
      country: '',
      state: '',
      rawDistrict: '',
      rawTaluk: '',
      rawLocality: ''
    };
  }

  let country = '';
  let state = '';
  let rawDistrict = '';
  let rawTaluk = '';
  let rawLocality = '';
  let fullAddress = '';

  // Case 1: Google Maps Geocode result
  if (data.address_components && Array.isArray(data.address_components)) {
    fullAddress = data.formatted_address || '';
    country = getAddressComponent(data, 'country');
    state = getAddressComponent(data, 'administrative_area_level_1');
    rawDistrict = getAddressComponent(data, 'administrative_area_level_2');
    rawTaluk = getAddressComponent(data, 'administrative_area_level_3');
    rawLocality =
      getAddressComponent(data, 'sublocality_level_1') ||
      getAddressComponent(data, 'sublocality') ||
      getAddressComponent(data, 'neighborhood') ||
      getAddressComponent(data, 'locality') ||
      getAddressComponent(data, 'postal_town');

    if (!rawDistrict) {
      rawDistrict = getAddressComponent(data, 'locality') || getAddressComponent(data, 'postal_town');
    }
  } 
  // Case 2: OpenStreetMap Nominatim result
  else if (data.address && typeof data.address === 'object') {
    const addr = data.address;
    fullAddress = data.display_name || '';
    country = addr.country || addr.country_code || '';
    state = addr.state || '';
    rawDistrict = addr.state_district || addr.county || addr.district || addr.city || '';
    rawTaluk = addr.subdistrict || addr.taluk || addr.county || addr.municipality || '';
    rawLocality = addr.suburb || addr.village || addr.town || addr.city_district || addr.neighbourhood || addr.road || '';
  }
  // Case 3: Raw string
  else if (typeof data === 'string') {
    fullAddress = data;
    if (data.toLowerCase().includes('india')) country = 'India';
    if (data.toLowerCase().includes('kerala')) state = 'Kerala';
  }

  // Strict Country Validation: Must be India
  const isIndia =
    country.toLowerCase() === 'india' ||
    country.toLowerCase() === 'in' ||
    (country === '' && fullAddress.toLowerCase().includes('india'));

  // Strict State Validation: Must be Kerala
  const isStateKerala =
    state.toLowerCase() === 'kerala' ||
    (state === '' && fullAddress.toLowerCase().includes('kerala')) ||
    (isIndia && Boolean(normalizeDistrictName(rawDistrict)));

  const isKerala = Boolean(isIndia && isStateKerala);

  // If outside Kerala or outside India -> NEVER populate Kerala administrative fields!
  if (!isKerala) {
    return {
      district: '',
      taluk: '',
      area: '',
      address: fullAddress,
      isKerala: false,
      country: country || 'Unknown',
      state: state || 'Unknown',
      rawDistrict: '',
      rawTaluk: '',
      rawLocality: ''
    };
  }

  // Resolve Kerala District
  const district = normalizeDistrictName(rawDistrict) || normalizeDistrictName(fullAddress);
  
  // Resolve Kerala Taluk
  const taluk = district ? (matchTaluk(district, rawTaluk, fullAddress) || matchTaluk(district, rawLocality, fullAddress)) : '';
  
  // Resolve Kerala Area / Locality
  const area = district && taluk ? matchArea(district, taluk, rawLocality, fullAddress) : '';

  return {
    district,
    taluk,
    area,
    address: fullAddress,
    isKerala: true,
    country: 'India',
    state: 'Kerala',
    rawDistrict,
    rawTaluk,
    rawLocality
  };
};