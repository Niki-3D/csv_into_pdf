# CSV to PDF Catalog Generator

An automated system that generates printable product catalogs in PDF format from CSV data and HTML/CSS templates. Perfect for B2B clients like bookstores or stationery shops who need to generate professional product catalogs.

## Features

- CSV data import with support for product details
- Dynamic HTML/CSS template rendering
- Automatic pagination and layout adjustment
- High-quality PDF generation
- Support for product images and clickable links
- Consistent formatting and styling
- Batch processing capability

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone this repository:
   ```bash
   git clone [repository-url]
   cd csv_into_pdf
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Place your CSV file in the `data` directory
2. Run the generator:
   ```bash
   npm run generate -- --input data/your-file.csv
   ```

The generated PDF will be saved in the `output` directory.

## CSV Format

Your CSV file should include the following columns:
- Product Name
- Category
- Description
- Image URL
- Shop Link

Example:
```csv
Product Name,Category,Description,Image URL,Shop Link
Product 1,Books,"Description here",http://example.com/image1.jpg,http://shop.com/product1
```

## Configuration

You can customize the template and styling by modifying the files in the `templates` directory.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

