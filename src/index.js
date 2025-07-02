const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { program } = require('commander');

// Configure CLI options
program
    .option('-i, --input <path>', 'Path to input CSV file')
    .option('-o, --output <path>', 'Output PDF file path')
    .option('-t, --template <path>', 'Custom template path')
    .parse(process.argv);

const options = program.opts();

// Default paths and configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
console.log('Project root:', PROJECT_ROOT);

const defaultTemplate = path.join(PROJECT_ROOT, 'templates', 'catalog.html');
const inputPath = options.input || path.join(PROJECT_ROOT, 'data', 'sample.csv');
const outputPath = options.output || path.join(PROJECT_ROOT, 'output', 'catalog.pdf');
const templatePath = options.template || defaultTemplate;

async function readCSV(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return parse(content, {
        columns: true,
        skip_empty_lines: true
    });
}

async function getImageAsBase64(imagePath) {
    try {
        // First try relative to project root
        let absolutePath = path.resolve(PROJECT_ROOT, imagePath);
        console.log(`Trying to read image from: ${absolutePath}`);

        if (!await fs.pathExists(absolutePath)) {
            console.error(`Image not found at: ${absolutePath}`);
            // Try without the 'data' prefix since we're already in the project root
            const alternativePath = path.resolve(PROJECT_ROOT, imagePath.replace(/^data\//, ''));
            console.log(`Trying alternative path: ${alternativePath}`);
            
            if (await fs.pathExists(alternativePath)) {
                absolutePath = alternativePath;
            } else {
                console.error(`Image not found at alternative path: ${alternativePath}`);
                return null;
            }
        }

        const imageBuffer = await fs.readFile(absolutePath);
        const base64 = imageBuffer.toString('base64');
        const extension = path.extname(imagePath).toLowerCase().substring(1);
        const mimeType = extension === 'jpg' || extension === 'jpeg' ? 'jpeg' : extension;
        
        console.log(`Successfully loaded image: ${absolutePath}`);
        return `data:image/${mimeType};base64,${base64}`;
    } catch (error) {
        console.error(`Error reading image ${imagePath}:`, error.message);
        return null;
    }
}

async function generateHTML(products, template) {
    const templateContent = await fs.readFile(template, 'utf-8');
    const productsPerPage = 4; // 2x2 grid
    let pages = [];

    // Add cover page
    pages.push(`
        <div class="page cover-page">
            <h1 class="cover-title">Product Catalog</h1>
            <p class="cover-subtitle">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
    `);

    // Generate product pages
    for (let i = 0; i < products.length; i += productsPerPage) {
        const pageProducts = products.slice(i, i + productsPerPage);
        const productHTML = await Promise.all(pageProducts.map(async product => {
            const imageData = await getImageAsBase64(product['Image Path']);
            const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
            
            return `
                <div class="product-card">
                    <img class="product-image" src="${imageData || placeholderImage}" alt="${product['Product Name']}">
                    <h2 class="product-name">${product['Product Name']}</h2>
                    <div class="product-category">${product['Category']}</div>
                    <p class="product-description">${product['Description']}</p>
                    <a class="product-link" href="${product['Shop Link']}">View Product</a>
                </div>
            `;
        }));

        pages.push(`
            <div class="page">
                <div class="product-grid">
                    ${productHTML.join('')}
                </div>
            </div>
        `);
    }

    // Insert pages into template
    return templateContent.replace(
        '<!-- Template will be populated dynamically -->',
        pages.join('')
    );
}

async function generatePDF(html, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0'
        }
    });

    await browser.close();
}

async function main() {
    try {
        console.log('Starting catalog generation...');
        
        // Ensure output directory exists
        await fs.ensureDir(path.dirname(outputPath));

        // Read and parse CSV
        console.log('Reading CSV file from:', inputPath);
        const products = await readCSV(inputPath);
        console.log('Found', products.length, 'products');

        // Generate HTML
        console.log('Generating HTML...');
        const html = await generateHTML(products, templatePath);

        // Generate PDF
        console.log('Generating PDF...');
        await generatePDF(html, outputPath);

        console.log(`PDF generated successfully: ${outputPath}`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main(); 