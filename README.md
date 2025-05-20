# Cash Planning Module

A comprehensive web application for financial planning and cash flow management with interactive visualizations.

## Features

### Data Entry
- Input funds and operational cash flow data
- Manage investments, lands, recurring payments, invoices, and supplier payments
- All data stored locally in IndexedDB

### Investment Timeline
- Visualize capital transactions over time (fund purchases/sales, land purchases/sales)
- Interactive timeline with date range filtering
- Track closing balance over time
- Filter by transaction amount

### Operational Cash Flow Timeline
- Visualize operational cash flows (recurring payments, non-recurring payments, invoices, supplier payments)
- Color-coded visualization of cash inflows and outflows
- Interactive timeline with date range filtering
- Balance tracking across all transactions

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Visualization**: D3.js for interactive charts
- **Storage**: IndexedDB for client-side data persistence
- **Architecture**: Modular JavaScript with separation of concerns

## Usage

1. **Data Entry Tab**: Input your financial data
2. **Investment Timeline Tab**: Visualize your capital transactions
3. **Operational Cash Flow Tab**: Analyze your day-to-day cash flow

## Future Enhancements

### Short-term Improvements
- Add export functionality for reports
- Implement data import/export for backup
- Add cash flow forecasting based on recurring transactions

### Long-term Vision
- Migrate to React.js for improved component architecture
- Add user authentication for multi-user support
- Implement server-side storage and synchronization

## Development

### Project Structure
- `/css` - Styling for the application
- `/js` - JavaScript modules for different features
  - `main.js` - Core application logic
  - `investment-chart.js` - Investment timeline visualization
  - `cashflow-chart.js` - Operational cash flow visualization

### Contributing
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License
MIT 