class Prompt < ApplicationRecord
    belongs_to :chat_thread
    validates :content, presence: true
    validates :response, presence: true
end
