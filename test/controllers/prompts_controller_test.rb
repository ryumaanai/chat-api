require "test_helper"

class PromptsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get prompts_index_url
    assert_response :success
  end

  test "should get create" do
    get prompts_create_url
    assert_response :success
  end
end
