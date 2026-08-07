const fs = require('fs');
const path = require('path');

const BACKEND_DIR = path.join('c:/Users/sandh/OneDrive/Desktop/Go yatriGo', 'backend');
const FRONTEND_DIR = path.join('c:/Users/sandh/OneDrive/Desktop/Go yatriGo', 'frontend');

// Helper
const getFiles = (dir, ext) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith(ext));
};

console.log("=== BACKEND AUDIT ===");

const models = getFiles(path.join(BACKEND_DIR, 'models'), '.js');
const controllers = getFiles(path.join(BACKEND_DIR, 'controllers'), '.js');
const routes = getFiles(path.join(BACKEND_DIR, 'routes'), '.js');

console.log(`Models: ${models.length}`);
console.log(`Controllers: ${controllers.length}`);
console.log(`Routes: ${routes.length}`);

const modelNames = models.map(m => m.replace('.js', '').toLowerCase());
const controllerNames = controllers.map(c => c.replace('Controller.js', '').toLowerCase());
const routeNames = routes.map(r => r.replace('Routes.js', '').replace('Route.js', '').replace('.js', '').toLowerCase());

const missingControllers = modelNames.filter(m => !controllerNames.includes(m));
console.log(`\nModels without named controllers: \n`, missingControllers.join(', '));

const missingRoutes = modelNames.filter(m => !routeNames.includes(m));
console.log(`\nModels without named routes: \n`, missingRoutes.join(', '));

// Check for inline logic in routes
console.log("\nRoutes with inline logic (contains 'req, res'):");
routes.forEach(routeFile => {
    const content = fs.readFileSync(path.join(BACKEND_DIR, 'routes', routeFile), 'utf8');
    if (content.includes('req, res')) {
        console.log(`- ${routeFile}`);
    }
});

console.log("\n=== FRONTEND AUDIT ===");
const getFilesRecursive = (dir, extList) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursive(file, extList));
        } else {
            if (extList.some(ext => file.endsWith(ext))) results.push(file);
        }
    });
    return results;
};

const frontendComponents = getFilesRecursive(path.join(FRONTEND_DIR, 'src', 'components'), ['.js', '.jsx']);
const frontendPages = getFilesRecursive(path.join(FRONTEND_DIR, 'src', 'pages'), ['.js', '.jsx']);

console.log(`Frontend Components: ${frontendComponents.length}`);
console.log(`Frontend Pages: ${frontendPages.length}`);

// Large components
console.log("\nLarge Frontend Files (> 300 lines):");
[...frontendComponents, ...frontendPages].forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length;
    if (lines > 300) {
        console.log(`- ${path.basename(file)} (${lines} lines) - ${file.replace(FRONTEND_DIR, '')}`);
    }
});
