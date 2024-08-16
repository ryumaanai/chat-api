class AddContextToChatThreads < ActiveRecord::Migration[7.1]
  def change
    add_column :chat_threads, :context, :text
  end
end
