import requests

def get_stations():

    url = "https://api.openaq.org/v3/locations"

    response = requests.get(url)

    return response.json()