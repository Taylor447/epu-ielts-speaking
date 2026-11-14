/* Campus layout interpreted from the supplied map. Room addresses retain their own sources. */
window.EPUCampusData = (() => {
  const buildings = [
    ['gate','Cổng chính','Bảo vệ và chỉ đường',-10,58,9,5,1,'gate','Campus Life'],
    ['A','Nhà A','Giảng đường',-2,24,55,12,4,'classroom','Study & Work'],
    ['B','Nhà B','Hành chính',34,43,16,11,4,'office','Study & Work'],
    ['C','Nhà C','Hội trường',-49,23,18,16,2,'hall','Campus Life'],
    ['D','Nhà D','Thư viện',25,4,17,14,3,'library','Books'],
    ['E','Nhà E','Nhà xưởng',-43,-13,30,24,3,'workshop','Engineering Projects'],
    ['G','Nhà G','Thí nghiệm',44,-18,29,10,4,'lab','Laboratory Work'],
    ['H','Nhà H','Nhà ở sinh viên',10,-47,28,10,4,'dorm','Student Dormitories'],
    ['I','Nhà I','Nhà ở học viên',48,-47,25,10,4,'dorm','Housing'],
    ['K','Nhà K','Giảng đường và nhà nghỉ học viên · căng tin ở tầng 1',-43,-47,31,11,3,'classroom','Food'],
    ['M','Nhà M','Giảng đường',59,10,13,32,4,'classroom','Study & Work'],
    ['N','Nhà N','Nhà xưởng',56,44,15,11,2,'workshop','Engineering Projects'],
    ['P','Nhà P','Giới thiệu sản phẩm',-48,54,17,8,1,'showroom','Shopping'],
    ['yard','Sân trường','Sinh hoạt sinh viên',-9,-5,19,14,1,'yard','Campus Life']
  ].map(([id,name,role,x,z,w,d,floors,kind,topic]) => ({id,name,role,x,z,w,d,floors,kind,topic}));

  const directory = 'https://epu.edu.vn/page/cac-don-vi';
  const faculties = [
    ['Điện toán và Công nghệ số năng lượng',null,'https://epu.edu.vn/post/khoa-dien-toan-va-cong-nghe-so-nang-luong-trang-bi-hanh-trang-dau-tien-cho-tan-sinh-vien-StMIs.html'],
    ['Kỹ thuật điện','M403','https://ee.epu.edu.vn/trang/gioi-thieu-2440-15.html'],
    ['Điện tử viễn thông','M305','https://fet.epu.edu.vn/trang/lien-he-2370-17.html'],
    ['Quản lý công nghiệp và Năng lượng',null,directory],
    ['Quản trị Kinh doanh','G3','https://fba.epu.edu.vn/','Nguồn công bố tầng 3, chưa có mã phòng.'],
    ['Quản trị Du lịch và Khách sạn',null,directory],
    ['Lý luận chính trị và Pháp luật',null,directory],
    ['Cơ khí - Ô tô và Xây dựng','M304','https://mpe.epu.edu.vn/chi-tiet-tin/gioi-thieu-khoa-co-khi-va-dong-luc-7-12395.html','Địa chỉ theo trang giới thiệu khoa dùng tên trước đây.'],
    ['Tự động hóa, Trí tuệ nhân tạo và Hệ thống thông minh','M205','https://fca.epu.edu.vn/chi-tiet-tin/thong-tin-tuyen-sinh-2026-khoa-dieu-khien-va-tu-dong-hoa-truong-dai-hoc-dien-luc-16-12432.html','Địa chỉ theo thông tin tuyển sinh 2026 của Khoa Điều khiển và Tự động hóa.'],
    ['Khoa học ứng dụng và Kỹ thuật',null,directory],
    ['Kế toán - Tài chính','M302','https://faf.epu.edu.vn/'],
    ['Năng lượng và phát triển bền vững','M201','https://ne.epu.edu.vn/trang/co-so-vat-chat-2493-20.html'],
    ['Ngoại ngữ',null,directory]
  ].map(([name,code,source,note]) => ({name,code,source,note,...(code==='G3'?{floor:3,floorOnly:true}:{})}));
  const publishedRooms = [
    ...faculties.filter(faculty => faculty.code),
    {code:'A109',name:'Công nghệ thông tin',source:'https://cntt.epu.edu.vn/CTGiangVien.aspx?ID=01180003',note:'Theo trang giới thiệu Khoa CNTT. Vị trí hiện tại của đơn vị sau đổi tên chưa được xác minh.'},
    {code:'A106',name:'Trung tâm Thực hành - Thí nghiệm',source:'https://pw.epu.edu.vn/trang/lien-he-2438-22.html'},
    {code:'E102',name:'Phòng Công tác sinh viên',source:'https://ctsv.epu.edu.vn/'},
    {code:'E108',name:'Phòng thí nghiệm thủy khí',source:'https://mpe.epu.edu.vn/trang/co-so-vat-chat-2471-7.html',kind:'lab'},
    {code:'M101',name:'Phòng thí nghiệm cơ điện tử',source:'https://mpe.epu.edu.vn/trang/co-so-vat-chat-2471-7.html',kind:'lab'},
    {code:'D3',floor:3,floorOnly:true,name:'Phòng đọc tại chỗ',source:'https://arc.epu.edu.vn/chi-tiet-tin/luan-van-tot-nghiep-khoi-kinh-te-quan-ly-29-13.html',note:'Nguồn công bố tầng 3, chưa có mã phòng.'}
  ];

  const lessons = {
    gate:['Asking for directions','Excuse me, how do I get to the library from here?','Go straight across the courtyard, then turn right.','campus gate|cổng trường;courtyard|sân trường;turn right|rẽ phải;security desk|chốt bảo vệ'],
    classroom:['Life in the classroom','What do you enjoy most about studying at university?','I like working on group projects because we learn from each other.','lecture hall|giảng đường;assignment|bài tập;whiteboard|bảng trắng;group project|dự án nhóm'],
    office:['At the student office','How would you ask for help with a missing student card?','I have lost my student card. Could you tell me how to get a replacement?','student card|thẻ sinh viên;application form|đơn đăng ký;service desk|quầy hỗ trợ;replacement|vật thay thế'],
    hall:['Presenting a project','Describe a time you spoke in front of an audience. Say where you were, what you spoke about, how you prepared, and explain how you felt afterwards.','Last semester, I gave a short presentation in my university’s main hall. My group had built a device that measured how much electricity a lamp used, and I had to explain our results. I practised with a friend the day before and replaced several technical terms with words that anyone could understand. At first I was nervous because the microphone made my voice sound unfamiliar. After a few minutes, I started looking at the audience instead of my notes. Two students asked how they could try the device at home. That made me feel that the presentation had actually helped people understand our project.','stage|sân khấu;microphone|micrô;audience|khán giả;presentation|bài thuyết trình'],
    library:['Borrowing a book','What kind of place helps you study well?','I prefer a quiet reading room with good light and plenty of desk space.','bookshelf|giá sách;reading room|phòng đọc;return date|ngày trả sách;borrow|mượn'],
    workshop:['Working safely','Describe a practical skill you would like to learn.','I would like to learn to assemble a circuit and check it safely before switching it on.','workbench|bàn thực hành;circuit|mạch điện;toolbox|hộp dụng cụ;protective gloves|găng bảo hộ'],
    lab:['Talking about experiments','Do you prefer experiments or lectures? Why?','I enjoy experiments because I can test my ideas and compare the results.','sensor|cảm biến;measurement|phép đo;equipment|thiết bị;test bench|bàn thí nghiệm'],
    dorm:['Sharing a room','What makes a good roommate?','A good roommate respects quiet hours and keeps shared spaces tidy.','roommate|bạn cùng phòng;bunk bed|giường tầng;locker|tủ cá nhân;quiet hours|giờ yên tĩnh'],
    showroom:['Introducing a product','How would you explain a useful device to a visitor?','This device measures electricity use. It helps people find ways to save energy.','display case|tủ trưng bày;prototype|mẫu thử;feature|tính năng;demonstration|buổi trình diễn'],
    food:['Ordering lunch','How would you order a meal and ask the price?','Could I have the chicken rice and an iced tea, please? How much is that altogether?','menu|thực đơn;serving|suất ăn;tray|khay;change|tiền thối'],
    yard:['Meeting a classmate','Where do students like to spend time between classes?','My friends and I often sit under the trees and talk about our next class.','bench|ghế dài;shade|bóng râm;classmate|bạn cùng lớp;break|giờ nghỉ']
  };
  const menu = [
    ['Cơm gà','Chicken rice',30000],['Cơm trứng','Egg rice',25000],['Bún thịt','Rice noodles with pork',28000],
    ['Bánh mì trứng','Egg baguette',18000],['Sữa đậu nành','Soy milk',10000],['Trà đá','Iced tea',5000]
  ];
  return {buildings, faculties, publishedRooms, lessons, menu, directory};
})();
