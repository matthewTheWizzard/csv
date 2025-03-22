class CsvService {
    /**
     * @param {string} csvData - CSV string data
     */
    constructor(csvData) {
      this.rawData = csvData;
      this.headers = [];
      this.rows = [];
      this.formattedRows = [];
      this.parseCsv();
    }
  
    /**
     * @param {Object} options
     * @param {string} options.delimiter - CSV delimiter (default: ',')
     */
    parseCsv({ delimiter = ',' } = {}) {
      const lines = this.rawData.split('\n');
      this.headers = lines.shift().split(delimiter);
      this.rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
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
  
    format() {
      const columnWidths = this.headers.map((_, i) => {
        return Math.max(
          this.headers[i].length,
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
  
    print() {
      this.formattedRows.forEach(row => console.log(row));
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
  // 2) Doesn't allow you to add new columns (it was a task)
  // 3) Formatter hardcoded
  
  const csvClient = new CsvService(data)
    .where({ header: 'density', transformer: val => parseInt(val) })
    .sort({ where: { header: 'density' }, by: 'DESC' })
    .format()
    .print();
