google.load('visualization', '1.0', {'packages':['corechart']});

function drawGenresChart(genres_data) {
    var processed_data = [];
    for (var genre in genres_data) {
      processed_data.push([genre, genres_data[genre]]);
    }

    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Genre');
    data.addColumn('number', 'Count');
    data.addRows(processed_data);

    // Set chart options
    var options = {'title':'Genres',
                    'pieHole': 0.5,
                    'backgroundColor': '#000000',
                                 'width':1000,
                                 'height':900,
        legend: {
          position: 'left',
          textStyle: {color: 'white'}
        }};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}