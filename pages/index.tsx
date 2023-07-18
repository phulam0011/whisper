import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Xin chào tôi là Smart Shark, tôi sẽ giúp bạn trả lời các câu hỏi về các quy tắc, quy định của Trường ĐHBK TP HCM',
        type: 'apiMessage',
      },
    ],
    history: [],
  });

  const { messages, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Vui lòng nhập vào câu hỏi!');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
        }),
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.text,
              sourceDocs: data.sourceDocuments,
            },
          ],
          history: [...state.history, [question, data.text]],
        }));
      }

      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
    }
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  const [isListen, setIsListen] = useState(false);

  const handleListen = () => {
    toggleRecording();
  };


  let chunks: any = [];

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>()

  async function queryData(data: any) {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/vphu123/whisper-base-totaldata',
      {
        headers: {
          Authorization: 'Bearer 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',
        },
        method: 'POST',
        body: data,
      },
    );

    const result = await response.json();
    return result;
  }

  function toggleRecording(){
    if(isListen){
      stopRecording();
    } else {
      startRecording();
    }
  }
  
  async function startRecording() {
    await navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    const media = new MediaRecorder(stream);
    media.ondataavailable = function (event: any) {
      chunks.push(event.data);
    };

    media.onstop = async function () {
      const audioBlob = new Blob(chunks);
      const audioFile = new File([audioBlob], 'recording.flac', {
        type: 'audio/flac',
      });
      const data = await fetchFileData(audioFile);
      const response = await queryData(data);
      displayResult(response);
    };
    media.start();
    setIsListen(true)
    setMediaRecorder(media)
    })
    .catch(function(err) {
      alert('Vui lòng cấp quyền truy cập micro!');
    });
  }

  function stopRecording() {
    mediaRecorder!.stop();
    setIsListen(false)
    
  }

  async function fetchFileData(file: any) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        resolve(reader.result);
      };

      reader.onerror = reject;

      reader.readAsArrayBuffer(file);
    });
  }

  function displayResult(response: any) {
    // setMsgRecord(response.text);
    setQuery(response.text);
  }

  return (
    <>
      <Layout>
        <header className={styles.header}>
          <div className={styles.container}>
            <div>
              <a>
                <Image
                  src="/logosmartshark.png"
                  alt="Smart Shark"
                  width={200}
                  height={200}
                  style={{
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                />
              </a>
            </div>
            <div className='header-menu'>              
                <ul className={styles.menunav}>
                  <li className={styles.li}>
                    <a href="" className={styles.navLink}>TRANG CHỦ</a>
                  </li>
                  <li className={styles.li}><a href="" className={styles.navLink}>GIỚI THIỆU</a></li>
                  <li className={styles.li}><a href="" className={styles.navLink}>LIÊN HỆ</a></li>
                </ul>              
            </div>
          </div>
        </header>
        <div className="mx-auto flex flex-col gap-4">
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        key={index}
                        src="/logo.png"
                        alt="AI"
                        width="40"
                        height="40"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={index}
                        src="/usericon.png"
                        alt="Me"
                        width="30"
                        height="30"
                        className={styles.usericon}
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      loading && index === messages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }
                  return (
                    <>
                      <div key={`chatMessage-${index}`} className={className}>
                        {icon}
                        <div className={styles.markdownanswer}>
                          <ReactMarkdown linkTarget="_blank">
                            {message.message}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {message.sourceDocs && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {message.sourceDocs.map((doc, index) => (
                              <div key={`messageSourceDocs-${index}`}>
                                <AccordionItem value={`item-${index}`}>
                                  <AccordionTrigger>
                                    <h3>Source {index + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ReactMarkdown linkTarget="_blank">
                                      {doc.pageContent}
                                    </ReactMarkdown>
                                    <p className="mt-2">
                                      <b>Source:
                                      </b> {doc.metadata.source}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </>
                  );
                })}
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={handleSubmit}>
                  <div className={styles.textareaWrapper}>
                    <textarea
                      disabled={loading}
                      onKeyDown={handleEnter}
                      ref={textAreaRef}
                      autoFocus={false}
                      rows={1}
                      maxLength={512}
                      id="userInput"
                      name="userInput"
                      placeholder={
                        loading
                          ? 'Đang tìm kiếm thông tin...'
                          : 'Bạn đang thắc mắc về vấn đề nào?'
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className={styles.textarea}
                    />
                    {/* <span className={styles.microIcon}>
                      <FaMicrophone />
                    </span> */}

                    <span className={styles.microIcon} onClick={handleListen}>
                      {isListen ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.generatebutton}
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      // Send icon SVG in input field
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {error && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </main>
        </div>
        <footer className="m-auto p-4">
          <a>
            Bản quyền thuộc Trường Đại học Bách Khoa - ĐHQG-HCM
          </a>
        </footer>
      </Layout>
    </>
  );
}
