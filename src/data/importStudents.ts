import studentsRaw from './students.csv?raw';

export function parseStudentsCSV() {
  const lines = studentsRaw.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const students = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length >= headers.length) {
      const student = {
        id: values[1],
        nokp: values[1],
        name: values[2],
        jantina: values[3],
        form: values[4],
        kelas_akademik: values[4],
        bidang: values[5],
        kelas_seni: values[6],
        gambar: values[7],
        image: values[7], // Temporarily set image so it doesn't break UI before reload
        room: '',
        phone: '',
        status: 'Aktif'
      };
      students.push(student);
    }
  }
  return students;
}
