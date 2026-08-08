/**
 * Bahasa Melayu / English strings (feature F17).
 * Plain terms only — 35.1% of Malaysian adults have low health literacy [R3].
 */
export const LANGS = ['en', 'ms'];

const S = {
  en: {
    brand: 'KiraSihat',
    continue: 'Continue',
    back: 'Back',
    required: 'Required',
    optional: 'Optional',
    nav: { data: 'Data', action: 'Action', goal: 'Goal', me: 'Me' },

    // ---------------------------------------------------------- screen 0
    w_kicker: 'SDG 3 · Good health and well-being',
    w_title: 'Malaysia publishes the data.\nWe turn it into one step.',
    w_lead:
      'Every year the Department of Statistics publishes what Malaysians die of. It is public, accurate, and almost unreadable. KiraSihat reads it for your age group and offers one general action — nothing more.',
    w_start: 'Start — about 2 minutes',
    w_seeData: 'See the data first',
    w_scroll: 'Scroll to see the figures',
    w_nationalTitle: 'Certified deaths in Malaysia, 2024',
    w_nationalLead: (total) =>
      `The four leading certified causes account for ${total.toLocaleString('en-MY')} deaths.`,
    w_deathsUnit: 'deaths',
    w_factorsTitle: 'The part that can change',
    w_factorsLead:
      'These are measured across Malaysian adults, not about you. They are why one small action is worth taking.',
    w_howTitle: 'Four screens, then you are done',
    w_step1: 'Tell us your age band',
    w_step1b: 'No name, no IC number, no exact age.',
    w_step2: 'See the official figures',
    w_step2b: 'The leading certified cause for that band, with its source.',
    w_step3: 'Choose one action',
    w_step3b: 'Two or three general options, each with a safety note.',
    w_step4: 'Keep the plan',
    w_step4b: 'One goal, editable, deletable at any time.',
    w_promiseTitle: 'What this is not',
    w_promise1: 'Not a diagnosis, and not a substitute for a clinician.',
    w_promise2: 'No personal risk score. We never tell you your chance of anything.',
    w_promise3: 'Nothing about you is stored until you save a goal, and you can delete it.',

    // screen 1
    p_step: 'STEP 1 OF 3',
    p_title: 'Tell us a little',
    p_sub: 'We use this only to find the closest official age group. No name, no IC number.',
    p_ageBand: 'Age band',
    p_official:
      'These are the age groups DOSM publishes. We never ask for your exact age or date of birth.',
    p_closest: 'Closest official DOSM band:',
    p_sexState: 'Sex',
    p_sex: 'Sex',
    p_sexWhy: 'Only so we can say whether a figure covers everyone or one sex. We do not ask for anything we do not use.',
    p_lifestyleWhy: 'These decide which general actions we show you first. They are never used to score your personal risk.',
    p_notSaid: 'Prefer not to say',
    p_lifestyle: 'Lifestyle checklist',
    p_flag_sedentary: 'I sit for most of the working day',
    p_flag_sugary_drinks: 'I have sugary drinks most days',
    p_flag_no_screening_3y: 'I have not had a health screening in 3 years',
    p_flag_smoker: 'I smoke or vape',
    // AC 1.1.3 — the fixed/changeable split.
    // "Changeable" here means only that NHMS 2023 [R2] measures these as
    // behaviours across Malaysian adults, so an action can address them.
    // It is NOT a claim that changing one alters this user's own risk.
    p_summary: 'Your answers',
    p_fixedTitle: 'Fixed — used only to pick the right published data',
    p_fixedBody: 'Age group and sex cannot be changed. They select which official figures to show.',
    p_changeTitle: 'Changeable — what an action can address',
    p_changeBody: 'NHMS 2023 measures these behaviours across Malaysian adults. Nothing here is a diagnosis.',
    p_changeNone: 'You have not ticked any. You can still choose an action on the next screen.',
    p_editHint: 'Change any answer above; this summary updates as you go.',
    p_notSet: 'Not chosen yet',
    p_consent:
      'I agree that this app shows population context only. It is not a diagnosis. I can delete my data at any time.',
    p_err_band: 'Please choose an age band before continuing.',
    p_err_consent: 'Please accept the notice before continuing.',
    p_male: 'Male',
    p_female: 'Female',

    // screen 2
    i_title: 'Your age group in the official data',
    i_sub: (band, year) => `Ages ${band} · Medically certified deaths · Malaysia ${year}`,
    i_notDiag: 'This is population data, not a diagnosis.',
    i_noRisk: 'No personal risk percentage is shown.',
    i_leading: (band) => `Leading certified cause, ages ${band}`,
    i_deaths: (n, pct) => `${n.toLocaleString()} deaths · ${pct}% of the age group`,
    i_factors: 'Factors you can change',
    i_factorsSub: (scope, year) => `${scope}, NHMS ${year}`,
    i_means: 'What this means for you',
    i_meansBody:
      'This is the most common certified cause in your age group. It is linked to factors many people can change: activity, diet, blood pressure and blood sugar.',
    i_mapped: (from, to) =>
      `You chose ${from}. Official data is published for ${to}, so that is the group shown here.`,
    i_next: 'See what I can do',
    i_empty:
      'No verified data has been published for this age group yet. The team must complete the DOSM extract before this screen can show a figure.',

    // screen 3
    a_title: 'Choose one action for this week',
    a_sub: 'General, source-linked guidance. Not treatment advice.',
    a_effort: { low: 'Low effort', medium: 'Medium effort', high: 'Higher effort' },
    a_firstStep: 'First step:',
    a_safety: 'Safety note:',
    a_urgentTitle: 'Chest pain, breathlessness or fainting?',
    a_urgentBody: 'Get urgent care now. Do not wait for a weekly goal.',
    a_save: 'Save as my weekly goal',
    a_pick: 'Choose one action to continue.',
    a_matched: 'Matches what you told us',
    a_why: (n) =>
      n === 0
        ? 'You did not tick anything on the checklist, so these are shown in the default order.'
        : `Ordered by what you ticked on the checklist. All ${
            n === 1 ? 'other options remain' : 'options remain'
          } available.`,
    a_noContent:
      'You ticked smoking or vaping. We have no reviewed quit-support content yet, so no action is offered for it. Ask a clinician or your Klinik Kesihatan about quit services.',

    // screen 4
    g_title: 'My plan',
    g_sub: 'One goal at a time. No streaks, no pressure.',
    g_thisWeek: 'THIS WEEK',
    g_target: (done, target) => `Target: ${target} days · Done: ${done} days`,
    g_bookTitle: 'Your task: book a health screening',
    g_bookSub:
      'This is a one-off appointment, not a weekly habit. There is nothing to tick off each day — book it once and you are done.',
    g_bookHow: 'How to book',
    g_bookStep1: 'Open MySejahtera, or use the MyGovernment service listing below.',
    g_bookStep2: 'Choose a health check appointment at a clinic near you.',
    g_bookStep3: 'Write the date somewhere you will see it.',
    g_bookNeed: 'What you need',
    g_bookNeed1: 'A phone number or email you can access.',
    g_bookNeed2: 'Your name and MyKad or passport number.',
    g_bookFree: 'The booking service itself is free of charge.',
    g_bookGov: 'MyGovernment service listing',
    g_bookGovSub: 'Official service directory · Ministry of Health Malaysia',
    g_booked: 'I have booked my appointment',
    g_bookedYes: 'Booked. Keep the date somewhere you will see it.',
    g_bookUndo: 'Not booked yet',
    g_bookNoPressure:
      'If you have not booked yet, that is fine. This does not expire and nothing is counted against you.',
    g_targetLabel: 'Days per week',
    g_targetHelp: (n) =>
      `You chose ${n} ${n === 1 ? 'day' : 'days'} a week. Change it any time — a lower number is not a failure.`,
    g_targetGuide:
      'The suggested 5 days comes from the WHO guidance quoted on the action, not from anything about you.',
    g_safety: 'Safety:',
    g_edit: 'Change goal',
    g_stop: 'Stop this goal',
    g_complete: 'Mark as complete',
    g_completed: 'Goal completed. You can start a new one whenever you are ready.',
    textSize: 'Text size',
    textSizeNormal: 'Normal text size',
    textSizeLarge: 'Larger text size',
    g_screening: 'Prepare for screening',
    g_screeningBody:
      'MySejahtera gives special focus to adults aged 40 and above and to people not screened for three years.',
    g_screeningWhy: {
      both: 'You match both published criteria: aged 40 or over, and no screening in the last 3 years.',
      age: 'You match one published criterion: aged 40 or over.',
      screening: 'You match one published criterion: no screening in the last 3 years.',
    },
    g_openLink: 'Open MySejahtera screening guide',
    g_officialLink: 'Official link · MOH Malaysia',
    g_questions: 'Questions to ask the clinician',
    g_q1: 'What should my blood pressure and blood sugar be?',
    g_q2: 'Which test should I do first at my age?',
    g_q3: 'Is this activity safe for me to start now?',
    g_reminders: 'Reminders',
    g_remindersBody: 'One gentle message each Sunday. Change it any time.',
    g_delete: 'Delete my data',
    g_deleteConfirm:
      'This removes your profile and your goal from the database. It cannot be undone. Continue?',
    g_deleted: 'Your data has been deleted.',
    g_none: 'You have no active goal yet.',
    g_startOver: 'Start again',

    // shared
    src_label: 'Source',
    src_year: 'data year',
    caveat: 'Caveat:',
    loading: 'Loading…',
    error: 'Could not load data. Check your connection and try again.',
  },

  ms: {
    brand: 'KiraSihat',
    continue: 'Teruskan',
    back: 'Kembali',
    required: 'Wajib',
    optional: 'Pilihan',
    nav: { data: 'Data', action: 'Tindakan', goal: 'Matlamat', me: 'Saya' },

    // ---------------------------------------------------------- skrin 0
    w_kicker: 'SDG 3 · Kesihatan yang baik dan kesejahteraan',
    w_title: 'Malaysia menerbitkan datanya.\nKami jadikannya satu langkah.',
    w_lead:
      'Setiap tahun Jabatan Perangkaan menerbitkan punca kematian rakyat Malaysia. Ia terbuka, tepat, dan hampir mustahil dibaca. KiraSihat membacanya untuk kumpulan umur anda dan menawarkan satu tindakan umum — tidak lebih.',
    w_start: 'Mula — kira-kira 2 minit',
    w_seeData: 'Lihat data dahulu',
    w_scroll: 'Tatal untuk melihat angka',
    w_nationalTitle: 'Kematian disahkan di Malaysia, 2024',
    w_nationalLead: (total) =>
      `Empat punca utama yang disahkan merangkumi ${total.toLocaleString('en-MY')} kematian.`,
    w_deathsUnit: 'kematian',
    w_factorsTitle: 'Bahagian yang boleh berubah',
    w_factorsLead:
      'Ini diukur dalam kalangan dewasa Malaysia, bukan tentang anda. Inilah sebabnya satu tindakan kecil berbaloi.',
    w_howTitle: 'Empat skrin, kemudian selesai',
    w_step1: 'Beritahu kumpulan umur anda',
    w_step1b: 'Tiada nama, tiada nombor IC, tiada umur tepat.',
    w_step2: 'Lihat angka rasmi',
    w_step2b: 'Punca disahkan utama bagi kumpulan itu, berserta sumbernya.',
    w_step3: 'Pilih satu tindakan',
    w_step3b: 'Dua atau tiga pilihan umum, setiap satu dengan nota keselamatan.',
    w_step4: 'Simpan pelan',
    w_step4b: 'Satu matlamat, boleh diubah, boleh dipadam bila-bila masa.',
    w_promiseTitle: 'Apa yang ini bukan',
    w_promise1: 'Bukan diagnosis, dan bukan pengganti pakar perubatan.',
    w_promise2: 'Tiada skor risiko peribadi. Kami tidak pernah menyatakan kemungkinan anda.',
    w_promise3: 'Tiada apa tentang anda disimpan sehingga anda simpan matlamat, dan anda boleh memadamnya.',

    p_step: 'LANGKAH 1 DARIPADA 3',
    p_title: 'Ceritakan sedikit tentang anda',
    p_sub: 'Ini hanya untuk mencari kumpulan umur rasmi yang terdekat. Tiada nama, tiada nombor IC.',
    p_ageBand: 'Kumpulan umur',
    p_official:
      'Ini kumpulan umur yang diterbitkan oleh DOSM. Kami tidak meminta umur tepat atau tarikh lahir anda.',
    p_closest: 'Kumpulan rasmi DOSM terdekat:',
    p_sexState: 'Jantina',
    p_sex: 'Jantina',
    p_sexWhy: 'Hanya untuk menyatakan sama ada sesuatu angka merangkumi semua orang atau satu jantina sahaja. Kami tidak bertanya perkara yang tidak kami gunakan.',
    p_lifestyleWhy: 'Ini menentukan tindakan umum mana yang kami tunjukkan dahulu. Ia tidak sekali-kali digunakan untuk menilai risiko peribadi anda.',
    p_notSaid: 'Tidak mahu nyatakan',
    p_lifestyle: 'Senarai semak gaya hidup',
    p_flag_sedentary: 'Saya duduk hampir sepanjang hari bekerja',
    p_flag_sugary_drinks: 'Saya minum minuman manis hampir setiap hari',
    p_flag_no_screening_3y: 'Saya tidak buat saringan kesihatan dalam 3 tahun',
    p_flag_smoker: 'Saya merokok atau vape',
    p_summary: 'Jawapan anda',
    p_fixedTitle: 'Tetap — hanya untuk memilih data terbitan yang betul',
    p_fixedBody: 'Kumpulan umur dan jantina tidak boleh diubah. Ia memilih angka rasmi yang dipaparkan.',
    p_changeTitle: 'Boleh diubah — perkara yang boleh ditangani oleh sesuatu tindakan',
    p_changeBody: 'NHMS 2023 mengukur tingkah laku ini dalam kalangan dewasa Malaysia. Tiada apa-apa di sini yang merupakan diagnosis.',
    p_changeNone: 'Anda belum menanda apa-apa. Anda masih boleh memilih tindakan di skrin seterusnya.',
    p_editHint: 'Tukar mana-mana jawapan di atas; ringkasan ini dikemas kini secara automatik.',
    p_notSet: 'Belum dipilih',
    p_consent:
      'Saya faham aplikasi ini hanya menunjukkan konteks populasi. Ia bukan diagnosis. Saya boleh padam data saya bila-bila masa.',
    p_err_band: 'Sila pilih kumpulan umur sebelum meneruskan.',
    p_err_consent: 'Sila terima notis sebelum meneruskan.',
    p_male: 'Lelaki',
    p_female: 'Perempuan',

    i_title: 'Kumpulan umur anda dalam data rasmi',
    i_sub: (band, year) => `Umur ${band} · Kematian disahkan perubatan · Malaysia ${year}`,
    i_notDiag: 'Ini data populasi, bukan diagnosis.',
    i_noRisk: 'Tiada peratusan risiko peribadi ditunjukkan.',
    i_leading: (band) => `Punca disahkan tertinggi, umur ${band}`,
    i_deaths: (n, pct) => `${n.toLocaleString()} kematian · ${pct}% daripada kumpulan umur`,
    i_factors: 'Faktor yang boleh anda ubah',
    i_factorsSub: (scope, year) => `${scope}, NHMS ${year}`,
    i_means: 'Apa maksudnya untuk anda',
    i_meansBody:
      'Ini punca disahkan yang paling biasa dalam kumpulan umur anda. Ia berkait dengan faktor yang ramai orang boleh ubah: aktiviti, pemakanan, tekanan darah dan gula dalam darah.',
    i_mapped: (from, to) =>
      `Anda pilih ${from}. Data rasmi diterbitkan untuk ${to}, jadi itulah kumpulan yang ditunjukkan di sini.`,
    i_next: 'Lihat apa saya boleh buat',
    i_empty:
      'Belum ada data disahkan untuk kumpulan umur ini. Pasukan perlu melengkapkan ekstrak DOSM sebelum skrin ini boleh menunjukkan angka.',

    a_title: 'Pilih satu tindakan untuk minggu ini',
    a_sub: 'Panduan umum berpaut sumber. Bukan nasihat rawatan.',
    a_effort: { low: 'Usaha rendah', medium: 'Usaha sederhana', high: 'Usaha tinggi' },
    a_firstStep: 'Langkah pertama:',
    a_safety: 'Nota keselamatan:',
    a_urgentTitle: 'Sakit dada, sesak nafas atau pengsan?',
    a_urgentBody: 'Dapatkan rawatan segera. Jangan tunggu matlamat mingguan.',
    a_save: 'Simpan sebagai matlamat mingguan',
    a_pick: 'Pilih satu tindakan untuk meneruskan.',
    a_matched: 'Sepadan dengan jawapan anda',
    a_why: (n) =>
      n === 0
        ? 'Anda tidak menanda apa-apa dalam senarai semak, jadi ini dipaparkan mengikut susunan lalai.'
        : 'Disusun mengikut apa yang anda tanda dalam senarai semak. Semua pilihan lain masih tersedia.',
    a_noContent:
      'Anda menanda merokok atau vape. Kami belum mempunyai kandungan sokongan berhenti merokok yang disemak, jadi tiada tindakan ditawarkan untuknya. Sila rujuk doktor atau Klinik Kesihatan anda tentang perkhidmatan berhenti merokok.',

    g_title: 'Pelan saya',
    g_sub: 'Satu matlamat pada satu masa. Tiada rentetan, tiada tekanan.',
    g_thisWeek: 'MINGGU INI',
    g_target: (done, target) => `Sasaran: ${target} hari · Selesai: ${done} hari`,
    g_bookTitle: 'Tugasan anda: tempah saringan kesihatan',
    g_bookSub:
      'Ini temujanji sekali sahaja, bukan tabiat mingguan. Tiada apa-apa untuk ditanda setiap hari — tempah sekali dan selesai.',
    g_bookHow: 'Cara menempah',
    g_bookStep1: 'Buka MySejahtera, atau guna senarai perkhidmatan MyGovernment di bawah.',
    g_bookStep2: 'Pilih temujanji pemeriksaan kesihatan di klinik berhampiran anda.',
    g_bookStep3: 'Catat tarikh di tempat yang anda akan nampak.',
    g_bookNeed: 'Apa yang anda perlukan',
    g_bookNeed1: 'Nombor telefon atau e-mel yang boleh anda akses.',
    g_bookNeed2: 'Nama anda dan nombor MyKad atau pasport.',
    g_bookFree: 'Perkhidmatan tempahan ini percuma.',
    g_bookGov: 'Senarai perkhidmatan MyGovernment',
    g_bookGovSub: 'Direktori perkhidmatan rasmi · Kementerian Kesihatan Malaysia',
    g_booked: 'Saya sudah menempah temujanji',
    g_bookedYes: 'Sudah ditempah. Simpan tarikh di tempat yang anda akan nampak.',
    g_bookUndo: 'Belum ditempah',
    g_bookNoPressure:
      'Jika anda belum menempah, tidak mengapa. Ini tidak luput dan tiada apa-apa dikira terhadap anda.',
    g_targetLabel: 'Hari seminggu',
    g_targetHelp: (n) => `Anda pilih ${n} hari seminggu. Tukar bila-bila masa — angka lebih rendah bukan kegagalan.`,
    g_targetGuide:
      'Cadangan 5 hari datang daripada panduan WHO yang dipetik pada tindakan itu, bukan daripada apa-apa tentang diri anda.',
    g_safety: 'Keselamatan:',
    g_edit: 'Tukar matlamat',
    g_stop: 'Hentikan matlamat ini',
    g_complete: 'Tandakan sebagai selesai',
    g_completed: 'Matlamat selesai. Anda boleh mulakan yang baharu bila-bila anda bersedia.',
    textSize: 'Saiz teks',
    textSizeNormal: 'Saiz teks biasa',
    textSizeLarge: 'Saiz teks lebih besar',
    g_screening: 'Bersedia untuk saringan',
    g_screeningBody:
      'MySejahtera memberi tumpuan khas kepada dewasa 40 tahun ke atas dan mereka yang tidak disaring selama tiga tahun.',
    g_screeningWhy: {
      both: 'Anda memenuhi kedua-dua kriteria terbitan: berumur 40 tahun ke atas, dan tiada saringan dalam 3 tahun lepas.',
      age: 'Anda memenuhi satu kriteria terbitan: berumur 40 tahun ke atas.',
      screening: 'Anda memenuhi satu kriteria terbitan: tiada saringan dalam 3 tahun lepas.',
    },
    g_openLink: 'Buka panduan saringan MySejahtera',
    g_officialLink: 'Pautan rasmi · KKM Malaysia',
    g_questions: 'Soalan untuk ditanya kepada doktor',
    g_q1: 'Berapakah bacaan tekanan darah dan gula yang sepatutnya?',
    g_q2: 'Ujian mana patut saya buat dahulu pada umur ini?',
    g_q3: 'Adakah aktiviti ini selamat untuk saya mulakan sekarang?',
    g_reminders: 'Peringatan',
    g_remindersBody: 'Satu mesej lembut setiap Ahad. Boleh tukar bila-bila masa.',
    g_delete: 'Padam data saya',
    g_deleteConfirm:
      'Ini akan membuang profil dan matlamat anda daripada pangkalan data. Tindakan ini tidak boleh dibatalkan. Teruskan?',
    g_deleted: 'Data anda telah dipadam.',
    g_none: 'Anda belum ada matlamat aktif.',
    g_startOver: 'Mula semula',

    src_label: 'Sumber',
    src_year: 'tahun data',
    caveat: 'Kaveat:',
    loading: 'Memuatkan…',
    error: 'Tidak dapat memuatkan data. Sila semak sambungan dan cuba lagi.',
  },
};

export function t(lang) {
  return S[lang] || S.en;
}

/** Pick the right language column off a row (cause_en / cause_ms). */
export function field(row, base, lang) {
  if (!row) return '';
  return row[`${base}_${lang}`] || row[`${base}_en`] || '';
}
