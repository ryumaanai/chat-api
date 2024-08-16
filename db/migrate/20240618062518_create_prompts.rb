class CreatePrompts < ActiveRecord::Migration[7.1]
  def change
    create_table :prompts do |t|
      t.text :content
      t.text :response
      t.timestamps
    end
  end
end
