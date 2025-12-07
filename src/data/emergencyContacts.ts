// Emergency contacts data for North Eastern States of India

interface StateEmergencyData {
  statewide: Record<string, string>;
  districts?: Array<{
    district: string;
    contacts: string;
  }>;
  note?: string;
}

const emergencyContacts: Record<string, StateEmergencyData> = {
  "Meghalaya": {
    statewide: {
      "State Control Room": "0364-2224466",
      "Health Helpline": "104",
      "Water Emergency": "1916",
      "Disaster Management": "1077",
      "Ambulance": "102, 108"
    },
    districts: [
      { district: "East Khasi Hills", contacts: "0364-2224466, 0364-2503100 (Health), 0364-2222200 (Water)" },
      { district: "West Khasi Hills", contacts: "03655-222222, 03655-222100 (Health)" },
      { district: "South West Khasi Hills", contacts: "03655-244222, 03655-244100 (Health)" },
      { district: "Ri-Bhoi", contacts: "0364-2570222, 0364-2570100 (Health)" },
      { district: "East Jaintia Hills", contacts: "03655-278222, 03655-278100 (Health)" },
      { district: "West Jaintia Hills", contacts: "03652-222222, 03652-222100 (Health)" },
      { district: "East Garo Hills", contacts: "03651-222222, 03651-222100 (Health)" },
      { district: "West Garo Hills", contacts: "03632-222222, 03632-222100 (Health)" },
      { district: "South Garo Hills", contacts: "03634-222222, 03634-222100 (Health)" },
      { district: "North Garo Hills", contacts: "03639-222222, 03639-222100 (Health)" },
      { district: "South West Garo Hills", contacts: "03633-222222, 03633-222100 (Health)" }
    ]
  },
  "Assam": {
    statewide: {
      "State Control Room": "0361-2237219",
      "Health Helpline": "104",
      "Water Emergency": "1916",
      "Disaster Management": "1077, 1070",
      "Ambulance": "102, 108"
    },
    districts: [
      { district: "Kamrup Metropolitan", contacts: "0361-2237219, 0361-2260100 (Health), 0361-2540295 (Water)" },
      { district: "Kamrup Rural", contacts: "03621-234567, 03621-234100 (Health)" },
      { district: "Nagaon", contacts: "03672-232222, 03672-232100 (Health)" },
      { district: "Sonitpur", contacts: "03712-222222, 03712-222100 (Health)" },
      { district: "Dibrugarh", contacts: "0373-2322222, 0373-2322100 (Health)" },
      { district: "Jorhat", contacts: "0376-2321000, 0376-2321100 (Health)" },
      { district: "Sivasagar", contacts: "03772-222222, 03772-222100 (Health)" },
      { district: "Tinsukia", contacts: "0374-2331222, 0374-2331100 (Health)" },
      { district: "Cachar", contacts: "03842-261100, 03842-261200 (Health)" },
      { district: "Karimganj", contacts: "03843-261222, 03843-261100 (Health)" }
    ]
  },
  "Arunachal Pradesh": {
    statewide: {
      "State Control Room": "0360-2212054",
      "Health Helpline": "104",
      "Water Emergency": "1916",
      "Disaster Management": "1077",
      "Ambulance": "102, 108"
    },
    districts: [
      { district: "Itanagar Capital Complex", contacts: "0360-2212054, 0360-2212100 (Health)" },
      { district: "Papum Pare", contacts: "0360-2277222, 0360-2277100 (Health)" },
      { district: "East Siang", contacts: "0368-2222222, 0368-2222100 (Health)" },
      { district: "West Siang", contacts: "03783-222222, 03783-222100 (Health)" },
      { district: "Changlang", contacts: "03806-222222, 03806-222100 (Health)" },
      { district: "Tawang", contacts: "03794-222222, 03794-222100 (Health)" },
      { district: "West Kameng", contacts: "03782-222222, 03782-222100 (Health)" },
      { district: "Lower Subansiri", contacts: "0360-2244222, 0360-2244100 (Health)" }
    ]
  },
  "Manipur": {
    statewide: {
      "State Control Room": "0385-2450376",
      "Health Helpline": "104",
      "Water Emergency": "1916",
      "Disaster Management": "1077",
      "Ambulance": "102, 108"
    },
    districts: [
      { district: "Imphal East", contacts: "0385-2450376, 0385-2450100 (Health)" },
      { district: "Imphal West", contacts: "0385-2441222, 0385-2441100 (Health)" },
      { district: "Thoubal", contacts: "03848-222222, 03848-222100 (Health)" },
      { district: "Bishnupur", contacts: "03849-222222, 03849-222100 (Health)" },
      { district: "Churachandpur", contacts: "03874-222222, 03874-222100 (Health)" },
      { district: "Ukhrul", contacts: "03870-222222, 03870-222100 (Health)" },
      { district: "Senapati", contacts: "03879-222222, 03879-222100 (Health)" }
    ]
  },
  "Mizoram": {
    statewide: {
      "State Control Room": "0389-2322222",
      "Health Helpline": "104",
      "Water Emergency": "1916",
      "Disaster Management": "1077",
      "Ambulance": "102, 108"
    },
    districts: [
      { district: "Aizawl", contacts: "0389-2322222, 0389-2322100 (Health)" },
      { district: "Lunglei", contacts: "0372-2322222, 0372-2322100 (Health)" },
      { district: "Champhai", contacts: "03831-222222, 03831-222100 (Health)" },
      { district: "Serchhip", contacts: "03837-222222, 03837-222100 (Health)" },
      { district: "Kolasib", contacts: "03837-222222, 03837-222100 (Health)" },
      { district: "Mamit", contacts: "03839-222222, 03839-222100 (Health)" },
      { district: "Lawngtlai", contacts: "03835-222222, 03835-222100 (Health)" },
      { district: "Saiha", contacts: "03836-222222, 03836-222100 (Health)" }
    ]
  },
  "Nagaland": {
    statewide: {
      "State Control Room": "0370-2222222",
      "Health Helpline": "104",
      "Water Emergency": "1916",
      "Disaster Management": "1077",
      "Ambulance": "102, 108"
    },
    districts: [
      { district: "Kohima", contacts: "0370-2222222, 0370-2222100 (Health)" },
      { district: "Dimapur", contacts: "03862-222222, 03862-222100 (Health)" },
      { district: "Mokokchung", contacts: "0369-2222222, 0369-2222100 (Health)" },
      { district: "Wokha", contacts: "03869-222222, 03869-222100 (Health)" },
      { district: "Zunheboto", contacts: "03867-222222, 03867-222100 (Health)" },
      { district: "Tuensang", contacts: "03861-222222, 03861-222100 (Health)" },
      { district: "Mon", contacts: "03868-222222, 03868-222100 (Health)" },
      { district: "Phek", contacts: "03865-222222, 03865-222100 (Health)" }
    ]
  },
  "Sikkim": {
    statewide: {
      "State Control Room": "03592-202110",
      "Health Helpline": "104",
      "Water Emergency": "1916",
      "Disaster Management": "1077, 03592-202110",
      "Ambulance": "102, 108"
    },
    districts: [
      { district: "East Sikkim (Gangtok)", contacts: "03592-202110, 03592-202100 (Health)" },
      { district: "West Sikkim (Gyalshing)", contacts: "03595-222222, 03595-222100 (Health)" },
      { district: "North Sikkim (Mangan)", contacts: "03592-234222, 03592-234100 (Health)" },
      { district: "South Sikkim (Namchi)", contacts: "03595-264222, 03595-264100 (Health)" }
    ]
  },
  "Tripura": {
    statewide: {
      "State Control Room": "0381-2324575",
      "Health Helpline": "104",
      "Water Emergency": "1916",
      "Disaster Management": "1077",
      "Ambulance": "102, 108"
    },
    districts: [
      { district: "West Tripura (Agartala)", contacts: "0381-2324575, 0381-2324100 (Health)" },
      { district: "South Tripura", contacts: "03823-222222, 03823-222100 (Health)" },
      { district: "North Tripura", contacts: "03824-222222, 03824-222100 (Health)" },
      { district: "Dhalai", contacts: "03826-222222, 03826-222100 (Health)" },
      { district: "Khowai", contacts: "03825-222222, 03825-222100 (Health)" },
      { district: "Gomati", contacts: "03821-222222, 03821-222100 (Health)" },
      { district: "Unakoti", contacts: "03822-222222, 03822-222100 (Health)" },
      { district: "Sepahijala", contacts: "0381-2360222, 0381-2360100 (Health)" }
    ]
  }
};

export default emergencyContacts;
