class CsvService {
    headers = [];
    rows = [];
    formattedRows = [];

    /**
     * @param {string} csvData - CSV string data
     */
    constructor(csvData) {
        this.rawData = csvData;
    }

    /**
     * @param {Object} options
     * @param {string} options.delimiter - CSV delimiter (default: ',')
     */
    parseCsv({ delimiter = ',' } = {}) {
        const lines = this.rawData.split('\n');
        this.headers = lines.shift().split(delimiter);
        this.rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
        return this;
    }

    /**
     * @param {Object} options
     * @param {string} options.header - The column header to transform
     * @param {Function} options.transformer - The transformation function
     * @returns {CsvService}
     */
    where({ header, transformer }) {
        const index = this.headers.indexOf(header);
        if (index === -1) throw new Error(`Header '${header}' not found`);

        this.rows = this.rows.map(row => {
            row[index] = transformer(row[index]);
            return row;
        });
        return this;
    }

    /**
     * @param {Object} options
     * @param {Object} options.where
     * @param {string} options.where.header - The column header to sort by
     * @param {'ASC' | 'DESC'} options.by - Sorting order
     * @returns {CsvService}
     */
    sort({ where: { header }, by }) {
        const index = this.headers.indexOf(header);
        if (index === -1) throw new Error(`Header '${header}' not found`);

        this.rows.sort((a, b) => {
            const aValue = a[index];
            const bValue = b[index];

            // TODO: Fix for other formats and corner cases
            // For now assume they are only numbers and strings

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return by === 'ASC' ? aValue - bValue : bValue - aValue;
            }


            return by === 'ASC' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        });
        return this;
    }

    /**
     * @param {Object} options
     * @param {string} options.header - The column header
     * @param {Object} options.calcValue - An object containing `where` and `transformer`
     * @param {Object} options.calcValue.where - The column header to be used for calculations
     * @param {Function} options.calcValue.transformer - The transformation function
     * @returns {CsvService}
     */
    addColumn({ header = '', calcValue }) {
        // TODO: It's better to have options to add a value or a function to calc value
        const { where: { header: calcHeader }, transformer } = calcValue;

        const calcIndex = this.headers.indexOf(calcHeader);
        if (calcIndex === -1) throw new Error(`Header '${calcHeader}' not found`);

        this.headers.push(header);

        this.rows = this.rows.map(row => {
            const value = row[calcIndex];
            const newValue = transformer(value);
            row.push(newValue);
            return row;
        });

        return this;
    }

    getColumn({ where: { header } }) {
        const index = this.headers.indexOf(header);
        if (index === -1) throw new Error(`Header '${header}' not found`);

        return this.rows.map(row => row[index]);
    }

    format() {
        const columnWidths = this.headers.map((_, i) => {
            return Math.max(
                this.headers.length,
                ...this.rows.map(row => String(row[i]).length)
            );
        });

        // TODO: Hardcode. Need to pass a function as a parameter
        const formatRow = row => row.map((cell, i) => {
            return i === 0 ? String(cell).padEnd(18) : String(cell).padStart(columnWidths[i] + 2);
        }).join('');

        this.formattedRows = [this.headers, ...this.rows].map(formatRow);
        return this;
    }

    print({ withHeaders = true } = {}) {
        const toPrint = withHeaders ? this.formattedRows : this.formattedRows.slice(1);
        toPrint.forEach(row => console.log(row));
    }
}

const data = `city,population,area,density,country
  Shanghai,24256800,6340,3826,China
  Delhi,16787941,1484,11313,India
  Lagos,16060303,1171,13712,Nigeria
  Istanbul,14160467,5461,2593,Turkey
  Tokyo,13513734,2191,6168,Japan
  Sao Paulo,12038175,1521,7914,Brazil
  Mexico City,8874724,1486,5974,Mexico
  London,8673713,1572,5431,United Kingdom
  New York City,8537673,784,10892,United States
  Bangkok,8280925,1569,5279,Thailand`;

// Main Idea: Create a prisma like, declarative tool to work with csv data (or other data sources)

// WIP

// TODO: 
// 1) Doesn't work with all the types of data
// 2) Doesn't allow you to add transformers to custom columns (here we need to calculate the percentage of all densities)
// 3) Formatter hardcoded

const csvClient = new CsvService(data)
    .parseCsv()
    .where({ header: 'density', transformer: val => parseInt(val) })
    .sort({ where: { header: 'density' }, by: 'DESC' })
    
const densityValues = csvClient.getColumn({ where: { header: 'density' } });
const maxDensity = Math.max(...densityValues);

csvClient
    .addColumn({
        calcValue: {
            where: { header: 'density' },
            transformer: val => Math.round((val * 100) / maxDensity)
        }
    })
    .format()
    .print({ withHeaders: false });
