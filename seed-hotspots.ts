const API_URL = 'http://localhost:3001/hot-spots';

const spots = [
  {
    id: '39ec6d43-22a6-44c9-a666-fd92e2c0de33',
    name: 'Cầu Vàng - Bà Nà Hills',
    description: 'Cây cầu biểu tượng với đôi bàn tay khổng lồ nâng đỡ.',
    category: 'Check-in',
    rating: '5.0',
    address: 'Hòa Vang, Đà Nẵng',
    lat: '15.9989000',
    lng: '107.9961000',
    images: [
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767064549/hotspots/uj912vujmvxafw1dh9jz.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767064551/hotspots/wf3gjv0fjpgrqgvwjolq.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767064553/hotspots/ppt7tf49qwdogohf2iwr.jpg',
    ],
    openingHours: '08:00 - 22:00',
    priceInfo: '850.000đ - 1.050.000đ',
    isHot: true,
    createdAt: '2025-12-30T03:15:56.886Z',
    updatedAt: '2025-12-30T03:15:56.886Z',
  },
  {
    id: 'cbca6735-1cc5-4c21-ab8b-454213f6cb9d',
    name: 'Cầu Rồng',
    description: 'Cầu có hình dáng rồng phun lửa và nước vào cuối tuần.',
    category: 'Check-in',
    rating: '5.0',
    address: 'Phước Ninh, Hải Châu, Đà Nẵng',
    lat: '16.0612000',
    lng: '108.2269000',
    images: [
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066197/hotspots/hzyyqwrcerluwso77gwu.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066200/hotspots/t66ryeikon4mhlzgvsog.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066202/hotspots/if9gzq3nsnpvajywkiog.jpg',
    ],
    openingHours: 'Mở cửa cả ngày',
    priceInfo: 'Miễn phí',
    isHot: true,
    createdAt: '2025-12-30T03:43:33.885Z',
    updatedAt: '2025-12-30T03:43:33.885Z',
  },
  {
    id: '23e8e902-f41a-472e-8d02-012e117e3352',
    name: 'Bán đảo Sơn Trà',
    description: 'Lá phổi xanh của thành phố Đà Nẵng.',
    category: 'Cảnh đẹp',
    rating: '5.0',
    address: 'Sơn Trà, Đà Nẵng',
    lat: '16.1214000',
    lng: '108.2777000',
    images: [
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066334/hotspots/qp4y8wnwjlhpdlpbefcg.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066337/hotspots/ljroepxapkpqhbcigbfi.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066339/hotspots/rpp93wlxgqm7vjky3x82.png',
    ],
    openingHours: 'Mở cửa cả ngày',
    priceInfo: 'Miễn phí',
    isHot: true,
    createdAt: '2025-12-30T03:45:43.415Z',
    updatedAt: '2025-12-30T03:45:43.415Z',
  },
  {
    id: '3d30ac7f-85af-4447-89d9-669a7ed607fe',
    name: 'Ngũ Hành Sơn',
    description: 'Quần thể 5 ngọn núi đá vôi với hệ thống hang động kỳ ảo.',
    category: 'Vãn cảnh',
    rating: '5.0',
    address: 'Hòa Hải, Ngũ Hành Sơn, Đà Nẵng',
    lat: '16.0039000',
    lng: '108.2631000',
    images: [
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066568/hotspots/t66ysopdnuno7gb9slm5.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066570/hotspots/cmkifgipp1ocdn43v7du.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066572/hotspots/sppedafg2yfhzfdvyklu.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066575/hotspots/orie5jlbd0gcbxpso9zd.png',
    ],
    openingHours: '07:00 - 17:30',
    priceInfo: '40.000đ',
    isHot: true,
    createdAt: '2025-12-30T03:53:27.952Z',
    updatedAt: '2025-12-30T03:53:27.952Z',
  },
  {
    id: '974d2f82-fe41-48b2-baca-d90412ee6854',
    name: 'Chợ Đêm Sơn Trà',
    description: 'Địa điểm vui chơi, mua sắm và ăn uống nhộn nhịp về đêm.',
    category: 'Ẩm thực',
    rating: '5.0',
    address: 'Mai Hắc Đế, An Hải Trung, Sơn Trà, Đà Nẵng',
    lat: '16.0608000',
    lng: '108.2285000',
    images: [
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066911/hotspots/inpevcccy7ngh3j9acfq.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066913/hotspots/so8h81nalc9pkbkxzuso.jpg',
      'https://res.cloudinary.com/daok0blh9/image/upload/v1767066915/hotspots/uaiyvnorv8kfh4qoacfe.jpg',
    ],
    openingHours: '',
    priceInfo: '',
    isHot: true,
    createdAt: '2025-12-30T03:55:18.543Z',
    updatedAt: '2025-12-30T03:55:18.543Z',
  },
];

async function seed() {
  for (const spot of spots) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spot),
      });
      if (response.ok) {
        console.log(`Seeded: ${spot.name}`);
      } else {
        const error = await response.text();
        console.error(`Failed to seed ${spot.name}:`, error);
      }
    } catch (error) {
      console.error(`Failed to seed ${spot.name}:`, error.message);
    }
  }
}

seed();
