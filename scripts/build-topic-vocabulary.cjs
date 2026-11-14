// Regenerate the topic learning subset from the dictionary already bundled with the app.
// Word lists are original editorial selections; meanings and IPA come from vi.wiktionary.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'EPU IELTS Speaking.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const begin = '// BEGIN TOPIC DICTIONARY DATA';
const end = '// END TOPIC DICTIONARY DATA';
const first = html.indexOf(begin);
const last = html.indexOf(end);
if (first < 0 || last < first) throw Error('Topic data markers are missing');

const topicSeeds = {
  'Quê hương và cộng đồng': 'hometown|town|village|city|countryside|neighbourhood|neighborhood|community|resident|citizen|local|landmark|heritage|tradition|festival|market|square|park|river|bridge|street|suburb|district|population|culture|dialect|architecture|monument|temple|museum|scenery~Phong cảnh|atmosphere|hospitality|volunteer|charity|identity|custom|region|province|childhood|landscape|historic|community centre',
  'Học tập đại học': 'university|college|course|lecture|seminar|tutorial|assignment|deadline~thời hạn|exam|examination|revision|scholarship~Học bổng|tuition|syllabus|textbook|library|campus|professor|lecturer|major|degree|curriculum|thesis|research|internship|graduation|qualification|certificate|knowledge|skill|academic|attendance|classroom|laboratory|experiment|presentation|project|essay|feedback|mentor|student',
  'Ẩm thực và mua sắm': 'ingredient|recipe|cuisine|meal|breakfast|lunch|dinner|dessert|beverage|tea|coffee~Cà phê.|noodle|rice|soup|vegetable|fruit|seafood|spicy|sweet|flavour|flavor|taste|appetite|restaurant|cafeteria|canteen~Căng tin|menu|price|discount|bargain|customer|cashier|supermarket|purchase|budget|affordable|dish|snack|bakery|fresh|delicious|nutrition|marketplace|shopping mall',
  'Gia đình và bạn bè': 'parent|mother|father|sibling|brother|sister|cousin|relative|spouse|friendship|companion|relationship|supportive|upbringing|childhood|marriage|household|generation|grandmother|grandfather|nephew|niece|reunion|trust|respect|caring|kindness|affection|loyalty|bond|conversation|celebration|neighbour|neighbor|family|friend|guardian|advice|memory|sharing',
  'Năng lượng và môi trường': 'renewable|energy|solar|wind|biomass|pollution|emission|carbon|sustainability|climate|biodiversity|recycling|conservation|efficiency|power plant|electricity|ecosystem|environment|waste|reusable|resource|fossil fuel|greenhouse gas|global warming|deforestation|habitat|wildlife|clean energy|water pollution|air pollution|electric vehicle|green energy|solar energy|wind energy|environmental|recycle|reduce|reuse|protect|preserve|nature',
  'Công việc và nghề nghiệp': 'profession|career|employee|employer|colleague|manager|workplace|salary|wage|interview|resume|promotion|training|contract|responsibility|leadership|teamwork|schedule|meeting|project|productivity|entrepreneur|business|company|office|occupation|recruitment|application~đơn xin|candidate|experience|skill|opportunity|deadline~thời hạn|performance|employment|workload|supervisor|client|customer|presentation|achievement',
  'Công nghệ số và AI': 'algorithm|application|software|hardware|device|smartphone|computer|laptop|database|data|network|internet|website|cybersecurity|privacy|automation|robot|artificial intelligence|machine learning|virtual reality|cloud computing|coding|programming|platform|digital|sensor|interface|processor|memory|storage|wireless|password|download|upload|update|innovation|technology|screen|online|mobile|information|simulation~mô phỏng|intelligence',
  'Giao thông và đô thị': 'bus|train|metro|subway|tram|bicycle|motorcycle|car|taxi|pedestrian|sidewalk|pavement|traffic|intersection|congestion|commute|journey|route|station|airport|vehicle|passenger|driver|parking|highway|street|road|bridge|urban|suburb|fare|ticket|timetable|transport|transportation|railway|crosswalk|traffic light|public transport|rush hour|road safety|infrastructure',
  'Du lịch và trải nghiệm': 'trip|journey|vacation|holiday|destination|itinerary|sightseeing|tourist|accommodation|hotel|hostel|reservation~giữ trước|passport|luggage|suitcase|map|guide|excursion|adventure|beach|mountain|island|museum|flight|airport|departure|arrival|souvenir|landmark|scenery~Phong cảnh|explore|memorable|travel|tourism|backpack|camping|hiking|culture|experience|photograph|landscape|coast',
  'Điện và kỹ thuật': 'electricity|voltage|current|circuit|resistor|capacitor|transformer~Máy biến thế|generator|motor|battery|electrode|conductor|insulator|power|watt|ampere|turbine|grid|transmission|distribution|switch|fuse|socket|plug|cable|wire|maintenance|installation|appliance|safety|fault|load|efficiency|engineering|mechanical|electrical|measurement|device|system|technician|equipment|renewable',
  'Đời sống sinh viên': 'dormitory|roommate|campus|canteen~Căng tin|cafeteria|library|classroom|lecture|club|society~Đoàn thể|friendship|timetable|homework|laundry|accommodation|rent|budget|volunteer|orientation|semester|attendance|hallway|courtyard|student|university|scholarship~Học bổng|part-time|study group|student union|study|exam|assignment|deadline~thời hạn|recreation|community|festival|sports club|meal~Bữa ăn|transport|graduation',
  'Thiên nhiên và thời tiết': 'weather|climate|season|sunshine|sunlight|rain|rainfall|storm|thunder|lightning|wind|breeze|fog|cloud|snow|humidity|temperature|forecast|river|lake|forest|mountain|ocean|coast|beach|valley|wildlife|species|habitat|landscape|drought|flood|earthquake|nature|waterfall|desert|hill|sky|sunset|sunrise|environment|flower',
  'Sức khỏe và vận động': 'health|fitness~sung sức|exercise|workout|sport|football|basketball|swimming|jogging|cycling|walking|yoga|diet|nutrition|sleep|stress|anxiety|wellbeing|medicine|hospital|doctor|nurse|injury|recovery|strength|stamina|flexibility|hydration|hygiene|symptom|prevention|healthy|muscle|heart|breathing|meditation|rest|energy|habit|routine',
  'Sở thích và giao tiếp': 'hobby|music|film~Phim, phim|movie|reading|book|photography|drawing|painting|cooking|gardening|dancing|singing|instrument|conversation|communication|discussion|presentation|debate|speaking|listening|empathy|humour|humor|social media|message|call|chat|leisure|entertainment|interest|talent|creativity|art|concert|game|friendship|language|story|podcast|theatre'
};

// The dictionary lists several senses. Prefer the one used in the learning topic.
const topicMeaningPatterns = {
  'Quê hương và cộng đồng': /quê|làng|thị xã|thành phố|địa phương|cộng đồng|di sản|truyền thống|lễ hội|dân cư|phong tục|kiến trúc|cảnh quan|bảo tàng|vùng miền|khu phố|tình nguyện|đền|chùa/i,
  'Học tập đại học': /khóa học|học tập|sinh viên|đại học|giảng|bài tập|bài luận|thuyết trình|thi cử|kỳ thi|thư viện|nghiên cứu|học bổng|luận văn|chứng chỉ|bằng cấp|trình độ|giáo trình|học phí|chuyên ngành|lớp học/i,
  'Ẩm thực và mua sắm': /bữa ăn|món ăn|đồ ăn|thức ăn|ẩm thực|nấu|hương vị|mùi vị|gia vị|khẩu vị|giá cả|cửa hàng|siêu thị|mua|bán|rau|trái cây|thực phẩm|đồ uống|căng tin|quán ăn|khách hàng/i,
  'Gia đình và bạn bè': /gia đình|cha|mẹ|bố|anh chị|chị em|họ hàng|người thân|bạn bè|tình bạn|vợ|chồng|con cái|ông bà|nuôi dạy|tình cảm|mối quan hệ|đoàn tụ/i,
  'Năng lượng và môi trường': /năng lượng|môi trường|ô nhiễm|khí hậu|tái tạo|tái chế|bảo tồn|sinh thái|tài nguyên|phát thải|điện|thiên nhiên|bền vững|mặt trời|gió|hiệu suất/i,
  'Công việc và nghề nghiệp': /nghề|việc làm|công việc|công ty|văn phòng|hợp đồng|lương|nhân viên|khách hàng|hội họp|thời hạn|kinh doanh|lãnh đạo|quản lý|phỏng vấn|tuyển dụng|ứng viên|năng suất/i,
  'Công nghệ số và AI': /máy tính|phần mềm|phần cứng|dữ liệu|điện tử|mạng|ứng dụng|công nghệ|trí tuệ|thuật toán|thiết bị|bảo mật|tự động|rô bốt|robot|lập trình|trực tuyến|màn hình|bộ nhớ|mô phỏng|cảm biến/i,
  'Giao thông và đô thị': /xe|tàu|giao thông|hành khách|vé|nhà ga|bến|đi lại|lái|đỗ|ô tô|đường phố|đường bộ|vỉa hè|ngã tư|đô thị|cầu vượt|tắc đường/i,
  'Du lịch và trải nghiệm': /du lịch|chuyến|hành trình|kỳ nghỉ|khách sạn|hộ chiếu|hành lý|tham quan|khởi hành|địa điểm|danh lam|cảnh đẹp|phong cảnh|đặt chỗ|giữ trước|cắm trại|thám hiểm|phiêu lưu|sân bay|chuyến bay/i,
  'Điện và kỹ thuật': /điện|mạch|cáp|dây dẫn|động cơ|máy phát|vôn|ampe|năng lượng|công suất|kỹ thuật|thiết bị|cầu chì|phích cắm|máy biến áp|điện trở|tụ điện|đo lường/i,
  'Đời sống sinh viên': /sinh viên|trường học|học tập|ký túc|phòng ở|căng tin|câu lạc bộ|hội sinh viên|bài tập|lớp học|bạn cùng phòng|thư viện|học kỳ|buổi giảng|đại học/i,
  'Thiên nhiên và thời tiết': /thời tiết|khí hậu|mưa|nắng|gió|sông|hồ|rừng|núi|biển|bão|tự nhiên|thiên nhiên|động vật|cây cối|mây|động đất|lũ lụt|dự báo/i,
  'Sức khỏe và vận động': /sức khỏe|thể dục|tập luyện|bệnh|bình phục|sung sức|khỏe|dinh dưỡng|thể thao|cơ bắp|giấc ngủ|tâm lý|căng thẳng|y tế|thuốc|bác sĩ|chấn thương|phục hồi/i,
  'Sở thích và giao tiếp': /sở thích|phim|nhạc|hát|đọc sách|viết|tranh|nghệ thuật|hội thoại|giao tiếp|nói chuyện|câu lạc bộ|trò chơi|giải trí|thư giãn|sáng tạo|chụp ảnh/i
};

const dictionary = new Map();
const editorialMeanings = {office:'văn phòng',metro:'tàu điện ngầm'};
const editorialExamples = {office:'I work in an office near the university.',metro:'I take the metro when I travel across the city.'};
function entry(word) {
  const bucket = /^[a-z]/.test(word) ? word[0] : '_';
  if (!dictionary.has(bucket)) {
    const file = path.join(root, 'assets', 'dictionary', bucket + '.bin');
    dictionary.set(bucket, JSON.parse(zlib.gunzipSync(fs.readFileSync(file)))[0]);
  }
  return dictionary.get(bucket)[word];
}
const output = [];
const summary = {};
for (const [group, seed] of Object.entries(topicSeeds)) {
  const used = new Set();
  let missing = 0;
  for (const candidate of seed.split('|')) {
    const [word, hint] = candidate.split('~');
    if (used.has(word)) continue;
    used.add(word);
    const item = entry(word);
    const senses = item?.[2] || [];
    if (!senses.length) { missing++; continue; }
    const candidates = senses.filter(sense => hint ? sense[1].toLocaleLowerCase('vi').includes(hint.toLocaleLowerCase('vi')) : topicMeaningPatterns[group].test(sense[1]));
    const selected = candidates.sort((a,b) => a[1].length-b[1].length)[0];
    const sense = selected || senses[0];
    const ipa = item[1]?.[0] ? '/' + item[1][0] + '/' : '';
    const example = editorialExamples[word] || item[3]?.map(row => row[2]).find(value => value && value.length <= 150 && value.toLowerCase().includes(word)) || '';
    const meaning = (editorialMeanings[word] || sense[1]).replace(/\s+/g, ' ').replace(/^\s*[;,]+\s*/, '').trim();
    if (meaning.length > 180) { missing++; continue; }
    output.push([item[0], ipa, meaning, example, word, group, editorialMeanings[word]?'curated':'dictionary', sense[2] || word]);
  }
  summary[group] = {added: output.filter(row => row[5] === group).length, skipped: missing};
}
const generated = 'const TOPIC_DICTIONARY_DATA=' + JSON.stringify(output).replace(/</g, '\\u003c') + ';\n';
const updated = html.slice(0, first + begin.length) + '\n' + generated + html.slice(last);
fs.writeFileSync(htmlPath, updated, 'utf8');
console.log(JSON.stringify({total: output.length, summary}, null, 2));
