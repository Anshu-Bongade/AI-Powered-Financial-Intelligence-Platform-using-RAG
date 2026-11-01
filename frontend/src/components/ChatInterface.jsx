import React from 'react';
import ChatbotDrawer from './ChatbotDrawer';

/**
 * ChatInterface delegates to ChatbotDrawer to provide a unified,
 * audited financial RAG assistant with verified cache badges,
 * structured metadata (section, page, chunk), non-empty citations,
 * and an interactive document selection dropdown.
 */
export default function ChatInterface(props) {
  return (
    <ChatbotDrawer
      {...props}
      selectedDoc={props.selectedDoc || 'Apple.pdf'}
      documents={props.documents || []}
      onSelectDoc={props.onSelectDoc}
      onDeleteDoc={props.onDeleteDoc}
    />
  );
}
