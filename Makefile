api-prd:
	docker-compose up --force-recreate --build baice-api-prd

api:
	docker-compose up baice-api

tests:
	docker-compose up test
