const fs = require('fs');

function addRemoveButton(filePath, stateVar, setterExpr) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern for the file input container
    const pattern = new RegExp(
        `(<div[^>]*relative group w-14 h-14[^>]*>)\\s*\\{${stateVar}\\s*\\?\\s*\\(\\s*<img[^>]*src=\\{URL.createObjectURL\\(${stateVar}\\)\\}[^>]*/>\\s*\\)\\s*:\\s*\\(\\s*<Camera[^>]*/>\\s*\\)\\s*<input[^>]*type="file"[^>]*onChange=\\{e\\s*=>\\s*${setterExpr}\\s*\\}\\s*/>\\s*</div>`,
        'g'
    );

    // This is too complex for a regex because of the many variations.
    // I will use a simpler string replacement.
}

// Let's try a very direct string replacement for specialist page
const specPath = 'src/app/specialist/[id]/page.js';
let specContent = fs.readFileSync(specPath, 'utf8');
const specTarget = `<span className="text-[11px] font-bold truncate text-slate-600">{selectedFile ? selectedFile.name : 'Click to add files'}</span>
                        <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />`;
const specReplacement = `<span className="flex-1 text-[11px] font-bold truncate text-slate-600">{selectedFile ? selectedFile.name : 'Click to add files'}</span>
                        <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
                        {selectedFile && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                            className="shrink-0 w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all ml-2"
                          >
                            <X size={12} />
                          </button>
                        )}`;

if (specContent.includes(specTarget)) {
    fs.writeFileSync(specPath, specContent.replace(specTarget, specReplacement));
    console.log('Specialist page updated');
} else {
    console.log('Specialist target not found');
}

// Admin page update
const adminPath = 'src/app/dashboard/admin/page.js';
let adminContent = fs.readFileSync(adminPath, 'utf8');
const adminTarget = `{doctorPhotoFile ? (
  <img src={URL.createObjectURL(doctorPhotoFile)} alt="Preview" className="w-full h-full object-cover" />
  ) : (
  <Camera className="text-slate-400" size={18} />
  )}
  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setDoctorPhotoFile(e.target.files?.[0])} />`;

const adminReplacement = `{doctorPhotoFile ? (
  <>
  <img src={URL.createObjectURL(doctorPhotoFile)} alt="Preview" className="w-full h-full object-cover" />
  <button 
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setDoctorPhotoFile(null);
    }}
    className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
  >
    <X size={10} />
  </button>
  </>
  ) : (
  <Camera className="text-slate-400" size={18} />
  )}
  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setDoctorPhotoFile(e.target.files?.[0])} />`;

if (adminContent.includes(adminTarget)) {
    fs.writeFileSync(adminPath, adminContent.replace(adminTarget, adminReplacement));
    console.log('Admin page updated');
} else {
    console.log('Admin target not found');
}
