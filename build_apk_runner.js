import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 1. Helper to run a synchronous command and print output
function runCmd(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    return true;
  } catch (err) {
    console.error(`Command failed: ${command}`, err.message);
    return false;
  }
}

// 2. Helper to run an interactive spawned command
function runInteractive(command, args, promptsMap) {
  return new Promise((resolve, reject) => {
    console.log(`\n==================================================`);
    console.log(`SPAWNING INTERACTIVE: ${command} ${args.join(' ')}`);
    console.log(`==================================================\n`);

    const proc = spawn(command, args, {
      shell: true,
      env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' }
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdoutBuffer += chunk;
      process.stdout.write(chunk); // Print live output

      // Check for prompt matches in the prompts map
      for (const [pattern, answer] of Object.entries(promptsMap)) {
        if (chunk.toLowerCase().includes(pattern.toLowerCase()) || 
            stdoutBuffer.toLowerCase().endsWith(pattern.toLowerCase())) {
          console.log(`\n\n[AUTOMATION MATCH] Matched: "${pattern}". Writing answer: "${answer.trim()}"\n`);
          proc.stdin.write(answer);
          
          // Only remove if it's not a password or license accept which could repeat
          if (!pattern.toLowerCase().includes('password') && 
              !pattern.toLowerCase().includes('license') && 
              !pattern.toLowerCase().includes('correct')) {
            delete promptsMap[pattern];
          }
          break;
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderrBuffer += chunk;
      process.stderr.write(chunk);
    });

    proc.on('close', (code) => {
      console.log(`\nFinished: ${command} with exit code ${code}\n`);
      if (code === 0) {
        resolve(stdoutBuffer);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  console.log('--- Starting Android APK Build Automation ---');

  // Verify Java installation
  console.log('Verifying Java JDK installation...');
  runCmd('java -version');

  // Check where Java is installed
  let javaPath = '/usr/lib/jvm/java-17-openjdk-amd64';
  if (!fs.existsSync(javaPath)) {
    // Search in /usr/lib/jvm
    try {
      const jvms = fs.readdirSync('/usr/lib/jvm');
      console.log('Available JVMs:', jvms);
      const found = jvms.find(dir => dir.includes('openjdk') || dir.includes('java-17'));
      if (found) {
        javaPath = path.join('/usr/lib/jvm', found);
      }
    } catch (e) {
      console.log('Could not list JVMs, defaulting to standard path:', javaPath);
    }
  }
  console.log(`Using JDK Path: ${javaPath}`);

  // Build the static assets first to ensure they exist for Bubblewrap to reference
  console.log('\nBuilding Vite project to populate public/dist assets...');
  runCmd('npm run build');

  // Install @bubblewrap/cli globally
  console.log('\nInstalling @bubblewrap/cli globally...');
  runCmd('npm install -g @bubblewrap/cli');

  // Set up local config path for bubblewrap config to pre-populate JDK and SDK locations if desired
  const homedir = os.homedir();
  const bwConfigDir = path.join(homedir, '.bubblewrap');
  if (!fs.existsSync(bwConfigDir)) {
    fs.mkdirSync(bwConfigDir, { recursive: true });
  }
  const bwConfigPath = path.join(bwConfigDir, 'config.json');
  console.log(`Pre-creating Bubblewrap config at: ${bwConfigPath}`);
  
  const bwConfig = {
    jdkPath: javaPath,
    androidSdkPath: '/root/android-sdk'
  };
  fs.writeFileSync(bwConfigPath, JSON.stringify(bwConfig, null, 2));

  // Deployed PWA manifest URL (pointing to local dev server to load the json, but domain will be customized)
  const manifestUrl = 'http://localhost:3000/manifest.json';
  
  // 1. Initialize Bubblewrap Project
  const initPrompts = {
    "? Path to the Java Development Kit (JDK)": `${javaPath}\n`,
    "? Path to the Java Development Kit": `${javaPath}\n`,
    "Path to the Java Development Kit": `${javaPath}\n`,
    "? Path to the Android SDK": "/root/android-sdk\n",
    "? Do you want to download the Android SDK": "y\n",
    "? Where would you like to save the Android SDK": "/root/android-sdk\n",
    "? Do you accept the license agreement": "y\n",
    "? Do you accept the SDK license agreement": "y\n",
    "? Do you accept the Android SDK license agreement": "y\n",
    "? Domain": "ais-pre-cuoieywfscjzkq2qhlojje-457798443138.asia-southeast1.run.app\n",
    "? URL path": "/\n",
    "? Application name": "The Ali's Collegiate LMS\n",
    "? Short name": "Ali's LMS\n",
    "? Package ID": "com.thealis.collegiatelms\n",
    "? Application ID": "com.thealis.collegiatelms\n",
    "? Launcher Activity name": "\n",
    "? Launcher Activity": "\n",
    "? Display mode": "\n",
    "? Orientation": "\n",
    "? Status Bar Color": "#00175c\n",
    "? Path to the icon": "./public/icon-512.png\n",
    "? Path to the maskable icon": "\n",
    "? Include splash screen": "\n",
    "? Splash screen": "\n",
    "? Include notification delegation service": "n\n",
    "? Include notification delegation": "n\n",
    "? Would you like to use these values": "\n"
  };

  try {
    await runInteractive('bubblewrap', ['init', `--manifest=${manifestUrl}`], initPrompts);
    console.log('Bubblewrap initialized successfully.');
  } catch (err) {
    console.error('Bubblewrap init failed, trying to continue build anyway:', err.message);
  }

  // 2. Build Bubblewrap Project
  const buildPrompts = {
    "? generate a new signing key": "Y\n",
    "? Generate a new signing key": "Y\n",
    "? Key store password": "password123\n",
    "? Key password": "password123\n",
    "? First and last name": "The Alis\n",
    "? Organizational unit": "Collegiate\n",
    "? Organization": "Alis\n",
    "? City or Locality": "Karachi\n",
    "? State or Province": "Sindh\n",
    "? Country code (2 letters)": "PK\n",
    "? Is this correct": "y\n",
    "? correct": "y\n",
    "? Password for the Key Store": "password123\n",
    "? Password for the Key": "password123\n"
  };

  try {
    await runInteractive('bubblewrap', ['build'], buildPrompts);
    console.log('\n==================================================');
    console.log('SUCCESS: Android APK and AAB packages generated!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('Bubblewrap build failed:', err.message);
  }

  // Look for generated APK/AAB and move them to root or public directory for easy download
  console.log('Scanning directories for generated packages...');
  try {
    const files = fs.readdirSync('.');
    console.log('Root files:', files);
    const apks = files.filter(f => f.endsWith('.apk'));
    const aabs = files.filter(f => f.endsWith('.aab'));
    
    console.log('Found APKs:', apks);
    console.log('Found AABs:', aabs);
  } catch (e) {
    console.error('Error scanning output:', e);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
