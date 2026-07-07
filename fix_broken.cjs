const fs = require('fs');
const path = 'src/components/Calls/CallListWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

// The broken section: inside the blacklist button's body (after the >) there's leaked delete code
// We need to replace everything between line 950 and 963 (0-indexed: 949-962)

const lines = content.split('\n');

// Find the exact broken pattern: the ">" line that closes the Ban button, followed by deleteCall
// We look for the first occurrence of the leaked deleteCall inside what should be <Ban />'s position
const brokenStart = '                           >\r\n                                     deleteCall(c.id);\r\n                                     toast.success(tr(';

// We'll use a regex approach to find and replace the broken section
// The broken block starts right after title={tr('افزودن...')} > 
// and ends before </React.Fragment>

const target = /( {28}>)\r?\n( {37}deleteCall\(c\.id\);[\s\S]*?tooltip-trigger shrink-0"\r?\n {30}title=\{tr\('[^']*', 'Delete number'\)\}\r?\n {28}>\r?\n {31}<Trash2 size=\{16\} \/>\r?\n {28}<\/button>\r?\n {24}<\/div>\r?\n {20}<\/td>\r?\n {18}<\/tr>)/;

const replacement = `                           >
                              <Ban size={14} />
                            </button>

                           {/* Delete */}
                           <button
                             onClick={() => {
                               setConfirmModalConfig({
                                 isOpen: true,
                                 title: tr('\u062d\u0630\u0641 \u0634\u0645\u0627\u0631\u0647', 'Delete number'),
                                 message: tr('\u0622\u06cc\u0627 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062a\u06cc\u062f \u06a9\u0647 \u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u06cc\u062f \u0627\u06cc\u0646 \u0634\u0645\u0627\u0631\u0647 \u0631\u0627 \u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0634\u0647 \u062d\u0630\u0641 \u06a9\u0646\u06cc\u062f\u061f', 'Are you sure you want to delete this number?'),
                                 onConfirm: () => {
                                   deleteCall(c.id);
                                   toast.success(tr('\u0634\u0645\u0627\u0631\u0647 \u062d\u0630\u0641 \u0634\u062f.', 'Number deleted.'));
                                 }
                               });
                             }}
                             className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-transparent text-slate-400 hover:bg-rose-100 hover:text-rose-600 shrink-0"
                             title={tr('\u062d\u0630\u0641 \u0634\u0645\u0627\u0631\u0647', 'Delete number')}
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                      </td>
                   </tr>`;

if (target.test(content)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('SUCCESS: Fixed the broken section!');
} else {
  console.log('PATTERN NOT FOUND - trying alternative approach...');
  
  // Fallback: line-based replacement of lines 949-962 (0-indexed)
  const newLines = [...lines];
  // line 949 (0-indexed) = line 950 (1-indexed): the ">" that starts the broken section
  // We need to find it by looking for the pattern
  let brokenLineIdx = -1;
  for (let i = 945; i < 965; i++) {
    if (newLines[i] && newLines[i].includes('deleteCall(c.id)') && i > 0 && newLines[i-1] && newLines[i-1].trim() === '>') {
      brokenLineIdx = i - 1;
      break;
    }
  }
  
  if (brokenLineIdx >= 0) {
    console.log('Found broken section at line ' + (brokenLineIdx + 1));
    // Find end of broken section (the </tr> that closes the row)
    let endIdx = brokenLineIdx;
    for (let i = brokenLineIdx; i < brokenLineIdx + 20; i++) {
      if (newLines[i] && newLines[i].includes('</tr>')) {
        endIdx = i;
        break;
      }
    }
    console.log('Broken section ends at line ' + (endIdx + 1));
    
    const fixedLines = [
      '                           >',
      '                              <Ban size={14} />',
      '                            </button>',
      '',
      '                           {/* Delete */}',
      '                           <button',
      '                             onClick={() => {',
      '                               setConfirmModalConfig({',
      '                                 isOpen: true,',
      '                                 title: tr(\'\u062d\u0630\u0641 \u0634\u0645\u0627\u0631\u0647\', \'Delete number\'),',
      '                                 message: tr(\'\u0622\u06cc\u0627 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062a\u06cc\u062f \u06a9\u0647 \u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u06cc\u062f \u0627\u06cc\u0646 \u0634\u0645\u0627\u0631\u0647 \u0631\u0627 \u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0634\u0647 \u062d\u0630\u0641 \u06a9\u0646\u06cc\u062f\u061f\', \'Are you sure you want to delete this number?\'),',
      '                                 onConfirm: () => {',
      '                                   deleteCall(c.id);',
      '                                   toast.success(tr(\'\u0634\u0645\u0627\u0631\u0647 \u062d\u0630\u0641 \u0634\u062f.\', \'Number deleted.\'));',
      '                                 }',
      '                               });',
      '                             }}',
      '                             className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-transparent text-slate-400 hover:bg-rose-100 hover:text-rose-600 shrink-0"',
      '                             title={tr(\'\u062d\u0630\u0641 \u0634\u0645\u0627\u0631\u0647\', \'Delete number\')}',
      '                           >',
      '                             <Trash2 size={14} />',
      '                           </button>',
      '                         </div>',
      '                      </td>',
      '                   </tr>',
    ];
    
    newLines.splice(brokenLineIdx, endIdx - brokenLineIdx + 1, ...fixedLines);
    fs.writeFileSync(path, newLines.join('\n'), 'utf8');
    console.log('SUCCESS: Fixed using line-based replacement!');
  } else {
    console.log('ERROR: Could not locate broken section!');
    // Print lines around the expected area
    for (let i = 945; i < 970; i++) {
      console.log('L' + (i+1) + ': ' + (newLines[i] || ''));
    }
  }
}
