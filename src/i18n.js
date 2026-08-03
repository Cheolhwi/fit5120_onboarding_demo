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

    // screen 1
    p_step: 'STEP 1 OF 3',
    p_title: 'Tell us a little',
    p_sub: 'We use this only to find the closest official age group. No name, no IC number.',
    p_ageBand: 'Age band',
    p_official:
      'These are the age groups DOSM publishes. We never ask for your exact age or date of birth.',
    p_closest: 'Closest official DOSM band:',
    p_sexState: 'Sex and state',
    p_sex: 'Sex',
    p_state: 'State',
    p_notSaid: 'Prefer not to say',
    p_lifestyle: 'Lifestyle checklist',
    p_flag_sedentary: 'I sit for most of the working day',
    p_flag_sugary_drinks: 'I have sugary drinks most days',
    p_flag_no_screening_3y: 'I have not had a health screening in 3 years',
    p_flag_smoker: 'I smoke or vape',
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

    // screen 4
    g_title: 'My plan',
    g_sub: 'One goal at a time. No streaks, no pressure.',
    g_thisWeek: 'THIS WEEK',
    g_target: (done, target) => `Target: ${target} days · Done: ${done} days`,
    g_edit: 'Change goal',
    g_stop: 'Stop this goal',
    g_screening: 'Prepare for screening',
    g_screeningBody:
      'MySejahtera gives special focus to adults aged 40 and above and to people not screened for three years.',
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

    p_step: 'LANGKAH 1 DARIPADA 3',
    p_title: 'Ceritakan sedikit tentang anda',
    p_sub: 'Ini hanya untuk mencari kumpulan umur rasmi yang terdekat. Tiada nama, tiada nombor IC.',
    p_ageBand: 'Kumpulan umur',
    p_official:
      'Ini kumpulan umur yang diterbitkan oleh DOSM. Kami tidak meminta umur tepat atau tarikh lahir anda.',
    p_closest: 'Kumpulan rasmi DOSM terdekat:',
    p_sexState: 'Jantina dan negeri',
    p_sex: 'Jantina',
    p_state: 'Negeri',
    p_notSaid: 'Tidak mahu nyatakan',
    p_lifestyle: 'Senarai semak gaya hidup',
    p_flag_sedentary: 'Saya duduk hampir sepanjang hari bekerja',
    p_flag_sugary_drinks: 'Saya minum minuman manis hampir setiap hari',
    p_flag_no_screening_3y: 'Saya tidak buat saringan kesihatan dalam 3 tahun',
    p_flag_smoker: 'Saya merokok atau vape',
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

    g_title: 'Pelan saya',
    g_sub: 'Satu matlamat pada satu masa. Tiada rentetan, tiada tekanan.',
    g_thisWeek: 'MINGGU INI',
    g_target: (done, target) => `Sasaran: ${target} hari · Selesai: ${done} hari`,
    g_edit: 'Tukar matlamat',
    g_stop: 'Hentikan matlamat ini',
    g_screening: 'Bersedia untuk saringan',
    g_screeningBody:
      'MySejahtera memberi tumpuan khas kepada dewasa 40 tahun ke atas dan mereka yang tidak disaring selama tiga tahun.',
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
