// Bangladesh Geographic Hierarchy Data
// Format: Division -> District -> Areas

export const bdLocations = {
  "Dhaka": {
    "Dhaka": ["Dhanmondi", "Gulshan", "Uttara", "Mirpur", "Banani", "Mohammadpur", "Badda", "Farmgate"],
    "Gazipur": ["Gazipur Sadar", "Kaliakair", "Sreepur"],
    "Narayanganj": ["Narayanganj Sadar", "Siddhirganj", "Sonargaon"]
  },
  "Chittagong": {
    "Chittagong": ["Panchlaish", "Double Mooring", "Halishahar", "Khulshi", "Nasirabad"],
    "Cox's Bazar": ["Cox's Bazar Sadar", "Teknaf", "Chakaria"],
    "Feni": ["Feni Sadar", "Chhagalnaiya"]
  },
  "Sylhet": {
    "Sylhet": ["Sylhet Sadar", "Zindabazar", "Amberkhana", "Shahjalal Uposhahar"],
    "Moulvibazar": ["Moulvibazar Sadar", "Sreemangal"],
    "Habiganj": ["Habiganj Sadar", "Nabiganj"]
  },
  "Rajshahi": {
    "Rajshahi": ["Rajshahi Sadar", "Boalia", "Motihar"],
    "Bogra": ["Bogra Sadar", "Sherpur", "Shajahanpur"],
    "Pabna": ["Pabna Sadar", "Ishwardi"]
  },
  "Khulna": {
    "Khulna": ["Khulna Sadar", "Boyra", "Khalishpur"],
    "Jessore": ["Jessore Sadar", "Jhikargacha"],
    "Kushtia": ["Kushtia Sadar", "Kumarkhali"]
  },
  "Barisal": {
    "Barisal": ["Barisal Sadar", "Nathullabad", "Rupatoli"],
    "Bhola": ["Bhola Sadar", "Char Fasson"],
    "Patuakhali": ["Patuakhali Sadar", "Kuakata"]
  },
  "Rangpur": {
    "Rangpur": ["Rangpur Sadar", "Mithapukur", "Pirganj"],
    "Dinajpur": ["Dinajpur Sadar", "Birganj"],
    "Kurigram": ["Kurigram Sadar", "Nageshwari"]
  },
  "Mymensingh": {
    "Mymensingh": ["Mymensingh Sadar", "Bhaluka", "Trishal"],
    "Jamalpur": ["Jamalpur Sadar", "Sarishabari"],
    "Netrokona": ["Netrokona Sadar", "Durgapur"]
  }
};

let currentLocations = { ...bdLocations };

export const mergeLocations = (dbData) => {
  const merged = { ...bdLocations };
  Object.keys(dbData).forEach(div => {
    if (!merged[div]) merged[div] = {};
    Object.keys(dbData[div]).forEach(dist => {
      if (dist === 'createdAt') return;
      if (!merged[div][dist]) merged[div][dist] = [];
      // Merge unique areas
      const combined = [...new Set([...(merged[div][dist] || []), ...(dbData[div][dist] || [])])];
      merged[div][dist] = combined;
    });
  });
  currentLocations = merged;
  return merged;
};

export const getDivisions = () => Object.keys(currentLocations);
export const getDistricts = (division) => division ? Object.keys(currentLocations[division] || {}) : [];
export const getAreas = (division, district) => (division && district) ? (currentLocations[division][district] || []) : [];
