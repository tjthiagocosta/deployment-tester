Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  get "healthz" => "probe#healthz"
  get "db-test" => "probe#db_test"
  root "probe#index"
end
