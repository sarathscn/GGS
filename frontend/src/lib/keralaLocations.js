// Kerala Administrative Hierarchy Data: Updated 2026
// State → District → Sub-District (Taluk) → Revenue Village

export const KERALA_LOCATION_DATA = {
  state: "Kerala",
  districts: [
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
      name: "Kozhikode",
      taluks: [
        { name: "Kozhikode", areas: ["Kozhikode City", "Beypore", "Cheruvannur", "Mavoor", "Kunnamangalam", "Feroke"] },
        { name: "Koyilandy", areas: ["Koyilandy Town", "Payyoli", "Perambra", "Atholi", "Balussery"] },
        { name: "Vadakara", areas: ["Vadakara Town", "Chombala", "Nadapuram", "Kuttiady", "Azhiyur"] },
        { name: "Thamarassery", areas: ["Thamarassery Town", "Koduvally", "Mukkom", "Thiruvambady"] }
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
      name: "Kasaragod",
      taluks: [
        { name: "Kasaragod", areas: ["Kasaragod Town", "Kumbla", "Badiadka", "Chengala", "Madhur"] },
        { name: "Hosdurg", areas: ["Kanhangad Town", "Nileshwaram", "Cheruvathur", "Trikarpur"] },
        { name: "Vellarikundu", areas: ["Vellarikundu Town", "Balal", "West Eleri", "East Eleri"] },
        { name: "Manjeshwaram", areas: ["Uppala", "Manjeshwar", "Paivalike", "Vorkady"] }
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
    }
  ]
};

// Helper functions remain functional as they use dynamic keys
export const getDistricts = () => KERALA_LOCATION_DATA.districts.map(d => d.name);

export const getTaluks = (district) => {
  const dist = KERALA_LOCATION_DATA.districts.find(d => d.name === district);
  return dist ? dist.taluks.map(t => t.name) : [];
};

export const getAreas = (district, taluk) => {
  const dist = KERALA_LOCATION_DATA.districts.find(d => d.name === district);
  if (!dist) return [];
  const tal = dist.taluks.find(t => t.name === taluk);
  return tal ? tal.areas : [];
};

export const formatLocation = (district, taluk, area) => {
  const parts = [area, taluk, district, 'Kerala'].filter(Boolean);
  return parts.join(', ');
};