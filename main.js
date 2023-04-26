const fileInput = document.getElementById("file-input");
fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    handleFiles(files);
});


async function handleFiles(files) {
    const results = [];
    const headers = [];
    for (const file of files) {
        const reader = new FileReader();
        const promise = new Promise((resolve, reject) => {
            reader.onload = () => {
                const data = new Uint8Array(reader.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                const dateColumns = Object.keys(rows[0]);
                headers.push(new Set(dateColumns))
                results.push({ name: file.name, data: rows });
                resolve();
            };
            reader.onerror = () => {
                reject(reader.error);
            };
        });
        reader.readAsArrayBuffer(file);
        await promise;
    }
    prepareTable(results);
    const commonColumns = headers.reduce((prev, current) => {
        if (prev.size === 0) {
            return current;
        } else {
            const intersection = new Set([...prev].filter(x => current.has(x)));
            return intersection;
        }
    });
    const container = document.getElementById('filters');
    commonColumns.forEach(value => {
        const input = document.createElement('input');
        input.type = "text"
        input.classList.add("filter")
        input.placeholder = value
        container.append(input)
    });
    const br = document.createElement('br');
    container.appendChild(br);
    const button = document.createElement('button');
    button.type = "button";
    button.onclick = filter;
    button.innerText = "Submit";
    container.appendChild(button);
}

function prepareTable(results) {
    const container = document.getElementById('result');
    container.innerHTML = '';
    results.forEach(result => {
        const table = document.createElement('table');
        const caption = document.createElement('caption');
        caption.innerText = result.name;
        table.appendChild(caption);
        const headerRow = document.createElement('tr');
        for (const key in result.data[0]) {
            const headerCell = document.createElement('th');
            headerCell.innerText = key;
            headerRow.appendChild(headerCell);
        }
        table.appendChild(headerRow);
        result.data.forEach(row => {
            const tableRow = document.createElement('tr');
            for (const key in row) {
                const tableCell = document.createElement('td');
                tableCell.innerText = row[key];
                tableRow.appendChild(tableCell);
            }
            tableRow.style.display = "none";
            table.appendChild(tableRow);
        });
        container.appendChild(table);
    });
}


function filter() {
    var filters = Array.from(document.querySelectorAll(".filter")).map(input => input.value.toUpperCase());
    var columnName = Array.from(document.querySelectorAll(".filter")).map(input => input.placeholder);

    // Declare variables 
    var tables, tr, td, i, txtValue;
    tables = document.getElementById("result").querySelectorAll("table");
    tables.forEach(table => {
        var headerRow = table.rows[0];

        const indices = columnName.map(name => {
            // Loop through each cell in the header row
            for (let i = 0; i < headerRow.cells.length; i++) {
                if (headerRow.cells[i].innerText === name) {
                    return i;
                }
            }
            // Return -1 if no match was found
            return -1;
        });

        tr = table.getElementsByTagName("tr");
        // Loop through all table rows, and show all the rows
        for (i = 0; i < tr.length; i++) {
            tr[i].style.display = "";
        }

        for (let j = 0; j < indices.length; j++) {
            if (filters[j] !== "") {
                // Loop through all table rows, and hide those who don't match the search query
                for (i = 0; i < tr.length; i++) {
                    td = tr[i].getElementsByTagName("td")[indices[j]];
                    if (td) {
                        txtValue = td.textContent || td.innerText;
                        if (txtValue.toUpperCase().indexOf(filters[j]) === -1) {
                            tr[i].style.display = "none";
                        }
                    }
                }
            }
        }
    });
}