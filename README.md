# Sports Betting Data Dahsboard

This project was inspired by a growing Sports Betting industry. The created dashboard intends to show a the revenue potential of the rapidly growing industry and explore differences in sports betting approach by differnet states. Since the Supreme Court’s decision in 2018 to overturn ban on sports betting, dozens of states have legalized online and/or in-person betting. Despite legalization, differences in state regulations have a visible effect on the industry’s growth and tax revenues. 

Factors with potential impact on industry’s growth:
- accessibility to placing bets 
- taxation of gambling income  

Sports Betting dahsboard consists of two pages visualizing changes in revenue growth on the National and State Specific level. 

National site shows:
- progression in legalization of sports betting across the US over the years
- the Top 5 states by revenue upon load
- the overall revenue totals each state and as a total contiribution since joining
- revenues over time broken down by ways to bet
- taxes over time broken down by ways to bet

State site depicts:
- state summary data
- tax & revenues over time
- revenue per capita over time

Project uses data BeautifulSoup scarped from sports betting websites and Census API. Files are fed into the javascript file via custom created JSON file datasets. Data is set to be stored in a SQL database.     
